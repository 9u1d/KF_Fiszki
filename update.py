import argparse
from bs4 import BeautifulSoup
import json
import re
import requests
import os

def download_images(questions, base_url="http://www.egzaminkf.pl/infusions/test_examination/"):
    if not os.path.exists('images'):
        os.makedirs('images')

    downloaded_images = set()
    images_count = 0

    for question in questions:
        image_url = question.get('image')
        if image_url and image_url not in downloaded_images:
            full_url = base_url + image_url
            filename = os.path.join('images', os.path.basename(image_url))

            try:
                response = requests.get(full_url, stream=True)
                if response.status_code == 200:
                    with open(filename, 'wb') as f:
                        for chunk in response:
                            f.write(chunk)
                    downloaded_images.add(image_url)
                    images_count += 1
                else:
                    print(f"Błąd podczas pobierania obrazu: {full_url}")
            except Exception as e:
                print(f"Wystąpił błąd: {e} podczas pobierania obrazu: {full_url}")

    print(f"Downloaded {images_count} uniq images.")

def fetch_html(url):
    response = requests.get(url)
    if response.status_code == 200:
        return response.text
    else:
        raise Exception(f"Failed to fetch the page: {url}")

def clean_text(text):
    text = re.sub(r'^\d+\.\s*', '', text)
    text = re.sub(r'^[a-e]\)\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s+\?', '?', text)
    return text.strip()

def parse_html_content(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')

    questions = []
    answers = []
    correct_answer_index = -1
    question_text = None
    question_image = None

    rows = soup.find_all('tr')
    first_row = True

    for row in rows:
        if first_row:
            first_row = False
            continue

        td = row.find('td')
        if not td:
            continue

        if "Wiadomości techniczne z zakresu radioelektroniki" in td.text:
            continue

        class_attr = td.get('class', [])
        if 'tbl2' in class_attr:
            if question_text is not None:
                questions.append({
                    'question': clean_text(question_text),
                    'answers': answers,
                    'correct': correct_answer_index,
                    'image': question_image
                })
                answers = []
                correct_answer_index = -1
                question_image = None
            question_text = td.text.strip()
        elif td.find('center'):
            img_tag = td.find('img')
            if img_tag:
                question_image = img_tag['src']
        elif 'tbl1' in class_attr:
            answer_text = td.text.strip()
            answer_text = clean_text(answer_text)
            answers.append(answer_text)
            if 'color:#008000' in str(td):
                correct_answer_index = len(answers) - 1

    if question_text is not None:
        questions.append({
            'question': clean_text(question_text),
            'answers': answers,
            'correct': correct_answer_index,
            'image': question_image
        })

    return questions


def write_questions_to_json(questions, output_file):
    with open(output_file, 'w', encoding='utf-8') as file:
        json.dump(questions, file, indent=4, ensure_ascii=False)

def main():
    parser = argparse.ArgumentParser(description="Converts HTML questions to a JSON format.")
    parser.add_argument("-r", "--result", required=True, help="Path to the resulting JSON file.")
    parser.add_argument("-u", "--url", help="URL of the page to fetch questions from.")
    args = parser.parse_args()

    html_content = fetch_html(args.url)
    questions = parse_html_content(html_content)

    download_images(questions)
    write_questions_to_json(questions, args.result)

    print(f"Converted {len(questions)} questions to JSON format at {args.result}")

if __name__ == "__main__":
    main()

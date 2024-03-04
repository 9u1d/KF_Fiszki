document.addEventListener('DOMContentLoaded', () => {
    let questions = [];
    function loadQuestions() {
        fetch('pytania.json')
            .then(response => response.json())
            .then(data => {
                questions = data;
                totalQuestions = questions.length;
                displayQuestion();
            })
            .catch(error => console.error("Błąd podczas ładowania pytań:", error));
    }
    let correctAnswersCount = 0;
    let currentQuestionIndex = 0;
    let totalQuestions = questions.length;
    loadQuestions();


	function displayQuestion() {
		currentQuestionIndex = Math.floor(Math.random() * questions.length);
		const currentQuestion = questions[currentQuestionIndex];

		const questionContainer = document.getElementById('question');
		const answersContainer = document.getElementById('answers');
		questionContainer.innerHTML = '';
		answersContainer.innerHTML = '';

		// Tworzenie i dodawanie tekstu pytania
		const questionText = document.createElement('div');
		questionText.textContent = currentQuestion.question;
		questionContainer.appendChild(questionText);

		// Sprawdzanie i dodawanie obrazka, jeśli istnieje w pytaniu
		if(currentQuestion.image) {
			const questionImage = document.createElement('img');
			questionImage.src = currentQuestion.image;
			questionImage.style.maxWidth = '100%'; // Dostosuj szerokość obrazka do kontenera
			questionImage.style.display = 'block'; // Wyświetlanie obrazka jako blokowego
			questionImage.style.margin = '10px auto'; // Centrowanie obrazka
			questionContainer.appendChild(questionImage);
		}

		// Mieszanie i dodawanie odpowiedzi
		const shuffledAnswers = currentQuestion.answers.map((a, i) => ({sort: Math.random(), value: a, index: i}))
														.sort((a, b) => a.sort - b.sort)
														.map((a) => a);

		shuffledAnswers.forEach(answer => {
			const answerDiv = document.createElement('div');
			answerDiv.innerHTML = answer.value;
			answerDiv.setAttribute('data-is-correct', answer.index === currentQuestion.correct);
			answerDiv.onclick = () => selectAnswer(answer.index, answerDiv);
			answersContainer.appendChild(answerDiv);
		});

		updateProgressBar();
	}

    function selectAnswer(index, answerDiv) {
        const isCorrect = index === questions[currentQuestionIndex].correct;
        disableAnswers();

        if (isCorrect) {
            correctAnswersCount++;
            answerDiv.classList.add('correct');
            questions.splice(currentQuestionIndex, 1);
        } else {
            answerDiv.classList.add('incorrect');
            questions.push(questions.splice(currentQuestionIndex, 1)[0]);
        }
	questions[currentQuestionIndex].asked = true;
        updateProgressBar();
    }

    function disableAnswers() {
        const answers = document.getElementById('answers').childNodes;
        answers.forEach(answer => {
            answer.onclick = null;
            answer.style.pointerEvents = 'none';
        });
    }

	function updateProgressBar() {
		const progressBar = document.getElementById('progress-bar');
		const progressText = document.getElementById('progress-text');
		let progressPercentage = (correctAnswersCount / totalQuestions) * 100;
		progressBar.style.width = `${progressPercentage}%`;
		progressText.innerText = `${correctAnswersCount}/${totalQuestions} (${Math.round(progressPercentage)}%)`;

		// Dodatkowa logika do zarządzania widocznością tekstu procentowego przy niskich wartościach postępu
		if(progressPercentage <= 5) {
			// Przesunięcie tekstu procentowego na zewnątrz paska postępu, gdy mało miejsca
			progressText.style.color = '#000'; // Czarny dla lepszej widoczności
			progressText.style.top = '0'; // Dostosuj, aby uniknąć nachodzenia na inne elementy
		} else {
			// Przywrócenie domyślnego stylu tekstu procentowego
			progressText.style.color = '#fff'; // Biały tekst wewnątrz paska
			progressText.style.top = '0'; // Tekst wewnątrz paska postępu
		}
	}

	function showPopup(message) {
		// Tworzenie nowego elementu DIV, który będzie naszym popupem
		const popup = document.createElement('div');
		popup.className = 'popup';
		popup.style.display = 'block'; // Ustawienie display na block, aby był widoczny od razu
		popup.innerHTML = `<span>${message}</span>`; // Dodanie wiadomości do popupu

		// Tworzenie przycisku zamknięcia
		const closeButton = document.createElement('button');
		closeButton.className = 'close-button';
		closeButton.textContent = 'X';
		closeButton.onclick = function() { // Funkcja, która obsługuje kliknięcie przycisku zamknięcia
			popup.style.display = 'none'; // Ukrycie popupu
			document.body.removeChild(popup); // Usunięcie popupu z DOM
		};

		// Dodanie przycisku zamknięcia do popupu
		popup.appendChild(closeButton);

		// Wyszukanie elementu #flashcard, przed którym chcemy umieścić popup
		const flashcardDiv = document.getElementById('flashcard');

		// Dodanie popupu do body przed elementem #flashcard
		document.body.insertBefore(popup, flashcardDiv);
	}



	function showCorrectAnswer() {
		const answers = document.getElementById('answers').childNodes;
		// Przejdź przez wszystkie odpowiedzi i zaznacz poprawną na podstawie atrybutu data-is-correct
		answers.forEach(answer => {
			if (answer.getAttribute('data-is-correct') === 'true') {
				answer.classList.add('correct');
			}
			// Uniemożliwienie dalszego zaznaczania odpowiedzi
			answer.style.pointerEvents = 'none';
		});

		// Usuń możliwość zaznaczania odpowiedzi
		disableAnswers();
	}
    document.getElementById('next').addEventListener('click', displayQuestion);
    document.getElementById('show-answer').addEventListener('click', showCorrectAnswer);
    displayQuestion();
});

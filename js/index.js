document.addEventListener("DOMContentLoaded", () => {
  /* --- Random Mode & Initialization Logic --- */
  const urlParams = new URLSearchParams(window.location.search);
  let mode = urlParams.get("mode");
  const qParam = urlParams.get("q");

  if (window.location.pathname.includes("exam.html") || document.getElementById("exam-start-overlay")) {
    mode = "exam";
  }

  let questionOrder = [];
  let currentStep = 0; 

  if (mode === "exam") {
    if (qParam === null) {
      localStorage.removeItem("quizAnswers");
      localStorage.removeItem("quizExamOrder");
    }
    const storedOrder = localStorage.getItem("quizExamOrder");
    if (storedOrder) {
      questionOrder = JSON.parse(storedOrder);
    } else {
      questionOrder = [...Array(quizData.length).keys()];
      for (let i = questionOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionOrder[i], questionOrder[j]] = [questionOrder[j], questionOrder[i]];
      }
      localStorage.setItem("quizExamOrder", JSON.stringify(questionOrder));
    }
  } else if (mode === "random") {
    const storedOrder = localStorage.getItem("quizRandomOrder");
    if (storedOrder) {
      questionOrder = JSON.parse(storedOrder);
    } else {
      questionOrder = [...Array(quizData.length).keys()];
      for (let i = questionOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionOrder[i], questionOrder[j]] = [questionOrder[j], questionOrder[i]];
      }
      localStorage.setItem("quizRandomOrder", JSON.stringify(questionOrder));
    }
    questionOrder = questionOrder.slice(0, 10);
  } else if (mode === "retry") {
    const retryOrder = localStorage.getItem("quizRetryOrder");
    if (retryOrder) {
      questionOrder = JSON.parse(retryOrder);
    } else {
      questionOrder = [];
    }
    questionOrder = questionOrder.slice(0, 10);
  } else {
    questionOrder = [...Array(quizData.length).keys()];
  }

  if (qParam !== null && !isNaN(parseInt(qParam))) {
    const targetIndex = parseInt(qParam);
    const foundStep = questionOrder.indexOf(targetIndex);
    if (foundStep !== -1) {
      currentStep = foundStep;
    } else {
      currentStep = 0;
    }
  } else {
    currentStep = 0;
  }

  let currentQuestionIndex = questionOrder[currentStep];
  let userAnswers = [];
  let quizContainer = document.getElementById("quiz-container");
  const checkButton = document.getElementById("check-answer");

  const nextButton = document.createElement("button");
  nextButton.textContent = "次の問題へ";
  nextButton.id = "next-button";
  nextButton.classList.add("btn-next"); 
  nextButton.style.display = "none";
  nextButton.addEventListener("click", () => {
    goToNextQuestion();
  });

  const nexttButton = document.getElementById("nextt-button");
  if (nexttButton) {
      nexttButton.addEventListener("click", () => {
        goToNextQuestion();
      });
  }

  function goToNextQuestion() {
    let userAnswers = JSON.parse(localStorage.getItem("quizAnswers")) || [];
    const questionObj = quizData[currentQuestionIndex];

    if (document.getElementById("check-answer").style.display !== "none") {
      const incorrectData = {
        question: questionObj.question,
        questionIndex: currentQuestionIndex,
        userAnswer: [], 
        correctAnswer: questionObj.answer
      };
      userAnswers.push(incorrectData);
      localStorage.setItem("quizAnswers", JSON.stringify(userAnswers));
    }

    currentStep++;
    if (currentStep >= questionOrder.length) {
      if (mode === "random") {
        localStorage.removeItem("quizRandomOrder");
      }
      if (mode === "retry") {
        localStorage.removeItem("quizRetryOrder");
      }
      if (mode === "exam") {
        localStorage.removeItem("quizExamOrder");
        localStorage.setItem("wasExamMode", "true"); 
      }
      window.location.href = "result.html";
      return;
    }
    currentQuestionIndex = questionOrder[currentStep];
    loadQuestion();
  }

  checkButton.insertAdjacentElement("afterend", nextButton);

  const showAnswerButton = document.getElementById("show-answer");

  if (showAnswerButton) {
    showAnswerButton.addEventListener("click", () => {
      const questionObj = quizData[currentQuestionIndex];
      const correctAnswer = questionObj.answer;

      let message = "正解：\n";

      if (questionObj.grouplimits) {
        for (let groupName in correctAnswer) {
          const items = correctAnswer[groupName];
          message += `【${groupName}】\n${items.join("\n")}\n\n`;
        }
      } else {
        for (let i = 0; i < correctAnswer.length; i++) {
          message += `${questionObj.placeholders[i]} → ${correctAnswer[i]}\n`;
        }
      }

      alert(message.trim());
    });
  }

  function loadQuestion() {
    const previousQuestionElem = document.querySelector("h2");
    if (previousQuestionElem) previousQuestionElem.remove();

    const previousResultMessage = document.querySelector(".incorrect-message");
    if (previousResultMessage) previousResultMessage.remove();

    // ▼追加：前回の問題文・画像があれば削除して画面をリセット
    const previousDetails = document.querySelector(".question-details");
    if (previousDetails) previousDetails.remove();

    quizContainer.innerHTML = "";
    nextButton.style.display = "none";
    checkButton.style.display = "block";
    checkButton.disabled = false;
    userAnswers = JSON.parse(localStorage.getItem("quizAnswers")) || [];

    if (currentStep >= questionOrder.length) {
      localStorage.setItem("quizAnswers", JSON.stringify(userAnswers));
      if (mode === "random") {
        localStorage.removeItem("quizRandomOrder");
      }
      if (mode === "exam") {
        localStorage.removeItem("quizExamOrder");
        localStorage.setItem("wasExamMode", "true"); 
      }
      window.location.href = "result.html";
      return;
    }

    const questionObj = quizData[currentQuestionIndex];

    // ▼変更：問題文と画像をquizContainerの「直前（上）」に挿入
    const questionDetailsContainer = document.createElement("div");
    questionDetailsContainer.classList.add("question-details");

    if (questionObj.text) {
      const textElem = document.createElement("p");
      textElem.innerHTML = questionObj.text; 
      questionDetailsContainer.appendChild(textElem);
    }

    if (questionObj.image) {
      const imgElem = document.createElement("img");
      imgElem.src = questionObj.image;
      imgElem.alt = "問題の画像";
      imgElem.classList.add("question-image");
      questionDetailsContainer.appendChild(imgElem);
    }

    // quizContainerの中ではなく、quizContainerのすぐ上に配置する
    if (questionObj.text || questionObj.image) {
      quizContainer.parentNode.insertBefore(questionDetailsContainer, quizContainer);
    }
    // ▲変更ここまで▲

    let headerTitle;
    if (mode === "exam") {
      headerTitle = document.getElementById("exam-title");
    } else {
      headerTitle = document.querySelector("h1");
    }

    if (headerTitle) {
      const total = questionOrder.length || quizData.length;
      if (mode === "exam") {
        const newTitle = `CCNA 模擬試験 (${currentStep + 1}/${total})`;
        headerTitle.textContent = newTitle;
        headerTitle.innerText = newTitle; 
      } else if (mode === "random") {
        headerTitle.textContent = `ドラッグアンドドロップ練習 (${currentStep + 1} / ${total})`;
      } else if (mode === "retry") {
        headerTitle.textContent = `復習モード (${currentStep + 1} / ${total})`;
      } else {
        headerTitle.textContent = `ドラッグアンドドロップ練習 (Q${currentQuestionIndex + 1})`;
      }
    }

    const answerContainer = document.createElement("div");
    answerContainer.classList.add("answer-container");

    const shuffledChoices = [...questionObj.choice].sort(() => Math.random() - 0.5);
    shuffledChoices.forEach((choice, index) => {
      const choiceElem = document.createElement("div");
      choiceElem.classList.add("draggable");
      choiceElem.draggable = true;
      choiceElem.dataset.index = index;
      choiceElem.textContent = choice;

      choiceElem.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", event.target.dataset.index);
        event.target.classList.add("dragging");
      });

      choiceElem.addEventListener("touchstart", handleTouchStart, { passive: false });
      choiceElem.addEventListener("touchmove", handleTouchMove, { passive: false });
      choiceElem.addEventListener("touchend", handleTouchEnd, { passive: false });

      choiceElem.addEventListener("dragend", (event) => {
        event.target.classList.remove("dragging");
      });

      answerContainer.appendChild(choiceElem);
    });

    answerContainer.addEventListener("dragover", (event) => {
      event.preventDefault();
      answerContainer.classList.add("drag-over");
    });
    answerContainer.addEventListener("dragleave", () => {
      answerContainer.classList.remove("drag-over");
    });
    answerContainer.addEventListener("drop", (event) => {
      event.preventDefault();
      answerContainer.classList.remove("drag-over");
      const draggedIndex = event.dataTransfer.getData("text/plain");
      const draggedElem = document.querySelector(`.draggable[data-index='${draggedIndex}']`);
      if (draggedElem) {
        answerContainer.appendChild(draggedElem);
      }
    });

    quizContainer.appendChild(answerContainer);

    const dropZoneContainer = document.createElement("div");
    dropZoneContainer.classList.add("drop-zone-container");

    if (questionObj.grouplimits) {
      Object.keys(questionObj.grouplimits).forEach(group => {
        const groupContainer = document.createElement("div");
        groupContainer.classList.add("group-container");
        groupContainer.dataset.group = group;

        const groupTitle = document.createElement("h3");
        groupTitle.textContent = group;
        groupContainer.appendChild(groupTitle);

        for (let i = 0; i < questionObj.grouplimits[group]; i++) {
          const dropZone = document.createElement("div");
          dropZone.classList.add("drop-zone");
          dropZone.dataset.group = group;

          dropZone.addEventListener("dragover", (event) => {
            event.preventDefault();
            dropZone.classList.add("drag-over");
          });

          dropZone.addEventListener("dragleave", () => {
            dropZone.classList.remove("drag-over");
          });

          dropZone.addEventListener("drop", (event) => {
            event.preventDefault();
            const draggedIndex = event.dataTransfer.getData("text/plain");
            const draggedElem = document.querySelector(`.draggable[data-index='${draggedIndex}']`);

            if (draggedElem) {
              const existingDraggable = dropZone.querySelector(".draggable");
              if (existingDraggable) {
                answerContainer.appendChild(existingDraggable);
              }
              dropZone.appendChild(draggedElem);
            }

            dropZone.classList.remove("drag-over");
          });

          groupContainer.appendChild(dropZone);
        }

        dropZoneContainer.appendChild(groupContainer);
      });
    } else {
      for (let i = 0; i < questionObj.answer.length; i++) {
        const dropZone = document.createElement("div");
        dropZone.classList.add("drop-zone");
        dropZone.dataset.position = i;

        const placeholder = document.createElement("span");
        placeholder.textContent = questionObj.placeholders[i];
        placeholder.classList.add("placeholder");
        dropZone.appendChild(placeholder);

        dropZone.addEventListener("dragover", (event) => {
          event.preventDefault();
          dropZone.classList.add("drag-over");
        });

        dropZone.addEventListener("dragleave", () => {
          dropZone.classList.remove("drag-over");
        });

        dropZone.addEventListener("drop", (event) => {
          event.preventDefault();
          const draggedIndex = event.dataTransfer.getData("text/plain");
          const draggedElem = document.querySelector(`.draggable[data-index='${draggedIndex}']`);

          if (draggedElem) {
            const existingDraggable = dropZone.querySelector(".draggable");
            if (existingDraggable) {
              answerContainer.appendChild(existingDraggable);
            }
            dropZone.appendChild(draggedElem);
          }
          dropZone.classList.remove("drag-over");
        });

        dropZoneContainer.appendChild(dropZone);
      }
    }

    quizContainer.appendChild(dropZoneContainer);
  }

  checkButton.addEventListener("click", () => {
    const questionObj = quizData[currentQuestionIndex];
    const dropZones = document.querySelectorAll(".drop-zone");
    const resultMessage = document.createElement("p");
    resultMessage.classList.add("incorrect-message");

    const userAnswerData = {
      question: questionObj.question,
      questionIndex: currentQuestionIndex, 
      userAnswer: [],
      correctAnswer: questionObj.answer
    };

    let isCorrect = false;

    if (questionObj.grouplimits) {
      const correctGroups = questionObj.answer;
      const userGroupAnswers = {};

      isCorrect = Object.keys(correctGroups).every(group => {
        const groupZones = document.querySelectorAll(`.drop-zone[data-group='${group}']`);
        const selectedGroupAnswers = Array.from(groupZones).map(zone =>
          zone.querySelector(".draggable") ? zone.querySelector(".draggable").textContent.trim() : null
        );

        userGroupAnswers[group] = selectedGroupAnswers;

        if (selectedGroupAnswers.includes(null) || selectedGroupAnswers.length !== correctGroups[group].length) {
          return false;
        }

        return JSON.stringify([...selectedGroupAnswers].sort()) === JSON.stringify([...correctGroups[group]].sort());
      });

      userAnswerData.userAnswer = userGroupAnswers;

      dropZones.forEach(zone => {
        const draggable = zone.querySelector(".draggable");
        if (draggable) {
          const group = zone.dataset.group;
          const correctGroupAnswers = correctGroups[group];
          if (!correctGroupAnswers.includes(draggable.textContent.trim())) {
            draggable.style.color = "red";
          } else {
            draggable.style.color = "green";
          }
        }
      });

    } else {
      const selectedOrder = Array.from(dropZones).map(zone =>
        zone.querySelector(".draggable") ? zone.querySelector(".draggable").textContent.trim() : null
      );

      userAnswerData.userAnswer = selectedOrder;

      if (
        selectedOrder.length === questionObj.answer.length &&
        !selectedOrder.includes(null) &&
        JSON.stringify(selectedOrder) === JSON.stringify(questionObj.answer)
      ) {
        isCorrect = true;
      }

      dropZones.forEach((zone, index) => {
        const draggable = zone.querySelector(".draggable");
        if (draggable) {
          if (draggable.textContent.trim() !== questionObj.answer[index]) {
            draggable.style.color = "red";
          } else {
            draggable.style.color = "green";
          }
        }
      });
    }

    const storedAnswers = JSON.parse(localStorage.getItem("quizAnswers")) || [];
    storedAnswers.push(userAnswerData);
    localStorage.setItem("quizAnswers", JSON.stringify(storedAnswers));

    if (mode === "exam") {
      goToNextQuestion();
      return; 
    }

    resultMessage.textContent = isCorrect ? "正解" : "不正解";
    resultMessage.style.color = isCorrect ? "green" : "red";
    quizContainer.after(resultMessage);

    checkButton.style.display = "none";
    nextButton.style.display = "block";
    const showAnswerButton = document.getElementById("show-answer");
    if (showAnswerButton) {
      showAnswerButton.style.display = "inline-block";
    }
  });

  const resetButton = document.getElementById("reset-button");

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      const questionObj = quizData[currentQuestionIndex];

      document.querySelectorAll(".drop-zone").forEach(zone => {
        const draggable = zone.querySelector(".draggable");
        if (draggable) {
          draggable.remove();
        }
      });

      const answerContainer = document.querySelector(".answer-container");
      answerContainer.innerHTML = "";

      const shuffledChoices = [...questionObj.choice].sort(() => Math.random() - 0.5);
      shuffledChoices.forEach((choice, index) => {
        const choiceElem = document.createElement("div");
        choiceElem.classList.add("draggable");
        choiceElem.draggable = true;
        choiceElem.dataset.index = index;
        choiceElem.textContent = choice;

        choiceElem.addEventListener("dragstart", (event) => {
          event.dataTransfer.setData("text/plain", event.target.dataset.index);
          event.target.classList.add("dragging");
        });

        choiceElem.addEventListener("dragend", (event) => {
          event.target.classList.remove("dragging");
        });

        answerContainer.appendChild(choiceElem);
      });

      const allResults = document.querySelectorAll(".incorrect-message").forEach(msg => msg.remove());

      checkButton.style.display = "block";
      checkButton.disabled = false;

      document.querySelectorAll(".draggable").forEach(elem => {
        elem.style.color = "";
      });

      nextButton.style.display = "none";

      if (allResults && allResults.length > 1) {
        for (let i = 0; i < allResults.length - 1; i++) {
          allResults[i].remove();
        }
      }

      checkButton.style.display = "block";
      checkButton.disabled = false;
      nextButton.style.display = "none";
      if (showAnswerButton) {
        showAnswerButton.style.display = "none";
      }
    });
  }

  const prevButton = document.getElementById("prev-button");
  if (prevButton) {
    prevButton.addEventListener("click", () => {
      if (currentStep > 0) {
        currentStep--;
        currentQuestionIndex = questionOrder[currentStep];
        loadQuestion();
      }
    });
  }

  window.startExam = function () {
    loadQuestion();
  };

  if (mode !== "exam") {
    loadQuestion();
  }

  let initialX = null;
  let initialY = null;
  let originalPosition = {};
  let draggedElement = null;

  function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    initialX = touch.clientX;
    initialY = touch.clientY;
    draggedElement = e.target;

    originalPosition = {
      parent: draggedElement.parentNode,
      nextSibling: draggedElement.nextSibling,
      cssText: draggedElement.style.cssText
    };

    draggedElement.classList.add("dragging");
    draggedElement.style.position = "fixed";
    draggedElement.style.zIndex = "1000";
    draggedElement.style.width = "200px"; 
    draggedElement.style.left = (touch.clientX - 100) + "px"; 
    draggedElement.style.top = (touch.clientY - 25) + "px"; 
  }

  function handleTouchMove(e) {
    if (!draggedElement) return;
    e.preventDefault();
    const touch = e.touches[0];
    draggedElement.style.left = (touch.clientX - 100) + "px";
    draggedElement.style.top = (touch.clientY - 25) + "px";
  }

  function handleTouchEnd(e) {
    if (!draggedElement) return;
    e.preventDefault();

    draggedElement.style.display = "none"; 
    const touch = e.changedTouches[0];
    const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    draggedElement.style.display = "flex"; 

    const dropZone = elemBelow ? elemBelow.closest(".drop-zone") : null;

    if (dropZone && !dropZone.querySelector(".draggable")) {
      resetDragStyles(draggedElement);
      dropZone.appendChild(draggedElement);
      draggedElement.classList.remove("dragging");
    } else {
      resetDragStyles(draggedElement);
      if (originalPosition.parent) {
        originalPosition.parent.insertBefore(draggedElement, originalPosition.nextSibling);
      }
      draggedElement.classList.remove("dragging");
    }
    draggedElement = null;
  }

  function resetDragStyles(elem) {
    elem.style.position = "";
    elem.style.zIndex = "";
    elem.style.width = "";
    elem.style.left = "";
    elem.style.top = "";
  }
});

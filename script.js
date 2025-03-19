document.addEventListener('DOMContentLoaded', () => {
    const chatHistory = document.getElementById('chat-history');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const clearMemoryButton = document.getElementById('clear-memory');

    if (!chatHistory || !userInput || !sendButton || !clearMemoryButton) {
        console.error('Ошибка: Один или несколько элементов UI не найдены!');
        return;
    }

    loadChatHistory();

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    clearMemoryButton.addEventListener('click', clearChatHistory);

    async function sendMessage() {
        const userMessage = userInput.value.trim();
        if (!userMessage) return;

        // Добавляем сообщение от пользователя с префиксом "Вы:"
        addMessageToHistory('user', `Вы: ${userMessage}`);
        userInput.value = '';

        // Отображаем сообщение, что ИИ ищет ответ
        const thinkingMessage = document.createElement('div');
        thinkingMessage.classList.add('message', 'assistant');
        thinkingMessage.innerHTML = '<strong>ИИ ищет ответ для вас...</strong>';
        chatHistory.appendChild(thinkingMessage);
        chatHistory.scrollTop = chatHistory.scrollHeight;

        try {
            const response = await fetch('http://localhost:3000/ollama/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gemma:2b',
                    messages: [
                        {
                            role: 'system',
                            content: 'Вы — высококвалифицированный эксперт в области истории оружия, специализирующийся на анализе эволюции различных типов оружия и их влиянии на культуру, общество и военные конфликты.' +
                            'Ответы должны быть точными, логичными, структурированными и изложенными на русском языке, с четким объяснением всех терминов.' +
                            'Избегайте вымышленных данных и непроверенной информации. Каждый ответ должен быть логичным, кратким, с последующим развернутым объяснением ключевых деталей, разделенным на абзацы.' +
                            'Используйте списки, выделение важных терминов с помощью жирного шрифта и курсивов. Ответы должны всегда быть на русском языке, с пояснением иностранных терминов (если используются).' +
                            'Пожалуйста, избегайте грамматических ошибок и старайтесь делать ответы максимально точными и понятными.' +
                            'Твоя главная задача - писать без ошибок и только на русском языке'
                        },
                        { role: 'user', content: userMessage },
                    ],
                    stream: false,
                }),
            });

            if (!response.ok) throw new Error(`Ошибка: ${response.status}`);

            const data = await response.json();
            if (data.message && data.message.content) {
                // Удаляем сообщение "ИИ ищет ответ"
                thinkingMessage.remove();
                // Добавляем ответ ИИ с префиксом "ИИ:"
                addMessageToHistory('assistant', `ИИ: ${formatResponse(data.message.content)}`);
            }
        } catch (error) {
            console.error('Ошибка:', error);
            thinkingMessage.remove();
            addMessageToHistory('assistant', '<p style="color: red;">Ошибка при обработке запроса.</p>');
        }
    }

    function formatResponse(text) {
        // Убираем лишние пробелы по краям
        text = text.trim();
    
        // Заменяем английские термины на русский
        text = text.replace(/firearms/g, 'огнестрельное оружие')
                   .replace(/weaponists/g, 'оружейники')
                   .replace(/history/g, 'история')
                   .replace(/military/g, 'военный')
                   .replace(/social/g, 'социальный')
                   .replace(/landscape/g, 'ландшафт')
                   .replace(/Chinese/g, 'китайский')
                   .replace(/weapons/g, 'оружие')
                   .replace(/gun/g, 'ружьё')
                   .replace(/bombs/g, 'бомбы')
                   .replace(/grenades/g, 'гранаты')
                   .replace(/hand-made/g, 'самодельное');
    
        // Разделяем текст на абзацы, если встречается двойной перенос строки
        text = text.replace(/\n\n+/g, '</p><p>');
    
        // Форматируем списки: заменяем пункты на теги <li> и заключаем в <ul>
        text = text.replace(/\n-\s+/g, '<li>').replace(/\n/g, '</li>');
    
        // Окружим список тегами <ul>
        if (text.includes('<li>')) {
            text = `<ul>${text}</ul>`;
        }
    
        // Форматируем жирный текст, окружая его тегами <strong>
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // жирный текст
    
        // Форматируем курсивный текст, окружая его тегами <em>
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>'); // курсивный текст
    
        // Добавляем правильные запятые и точки для читаемости
        text = text.replace(/(\w)(\s+)/g, '$1, '); // Добавляем запятую после каждого слова
    
        // Возвращаем отформатированный текст с абзацами
        return `<p>${text}</p>`;
    }
    

    function addMessageToHistory(role, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', role);

        const messageText = document.createElement('div');
        messageText.innerHTML = message;
        messageElement.appendChild(messageText);

        // Для сообщений от ИИ добавляем кнопку сохранения, только если это не временное сообщение
        if (role === 'assistant' && !message.includes("ИИ ищет ответ для вас...")) {
            const saveButton = document.createElement('button');
            saveButton.textContent = 'Сохранить ответ';
            saveButton.classList.add('save-button');
            saveButton.dataset.message = message;
            saveButton.addEventListener('click', () => saveAnswer(message));
            messageElement.appendChild(saveButton);
        }

        chatHistory.appendChild(messageElement);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        saveChatHistory();
    }

    function saveAnswer(message) {
        // Извлекаем текст без HTML тегов
        const textToCopy = message.replace(/(<([^>]+)>)/gi, "");
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
            console.log('Ответ скопирован в буфер обмена!');
            })
            .catch(err => {
                console.error('Ошибка при копировании в буфер обмена:', err);
            });
    }

    function saveChatHistory() {
        localStorage.setItem('chatHistory', chatHistory.innerHTML);
    }

    function loadChatHistory() {
        const savedHistory = localStorage.getItem('chatHistory');
        if (savedHistory) chatHistory.innerHTML = savedHistory;
    }

    function clearChatHistory() {
        localStorage.removeItem('chatHistory');
        chatHistory.innerHTML = '';
    }
});

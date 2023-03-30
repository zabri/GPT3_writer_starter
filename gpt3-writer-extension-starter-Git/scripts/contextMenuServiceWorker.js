const getKey = () => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['openai-key'], (result) => {
        if (result['openai-key']) {
          const decodedKey = atob(result['openai-key']);
          resolve(decodedKey);
        }
      });
    });
  };
  const sendMessage = (content) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0].id;
  
      chrome.tabs.sendMessage(
        activeTab,
        { message: 'inject', content },
        (response) => {
          if (response.status === 'failed') {
            console.log('injection failed.');
          }
        }
      );
    });
  };

const generate = async (prompt) => {
  const key = await getKey();
  const url = 'https://api.openai.com/v1/completions';
	
  const completionResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 900,
      temperature: 0.7,
    }),
  });
	
  const completion = await completionResponse.json();
  return completion.choices.pop();
}
const generateCompletionAction = async (info) => {
    try {
        sendMessage('generating...');

        const { selectionText } = info;
        const basePromptPrefix = `
        Write me a detailed table of contents for an essay with the title below.
    
        Title:
        `;
        const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`);
        const secondPrompt = `
        Take the table of contents and title of the essay below and generate an essay.
        
        Title: ${selectionText}
        
        Table of Contents: ${baseCompletion?.text}
        
        Essay:
        `;
       

      // Call your second prompt
      const secondPromptCompletion = await generate(secondPrompt);

        sendMessage(secondPromptCompletion.text);
      } catch (error) {
        console.log(error);
        sendMessage(error.toString());  
    
    }
}


chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'context-run',
      title: 'Generate Essay',
      contexts: ['selection'],
    });
  });
  
  chrome.contextMenus.onClicked.addListener(generateCompletionAction);
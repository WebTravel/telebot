//TODO
// Сделать каждое утро вывод погоды и хлеб насущный

//Список переменных
const TelegramBot = require('node-telegram-bot-api');
const token = '';
const cron = require('cron').CronJob;
const request = require('request');
const cheerio = require("cheerio");
const http = require('http');

//Создаем и запускаем бота для бесконечного прослушивания событий
const bot = new TelegramBot(token, {
  polling: true
});


/*Вспомогательные функции*/
  //Функция рандомного вывода
  function getRandomInt(aMin, aMax) {
    return Math.floor(Math.random() * (aMax - aMin + 1)) + aMin;
  }

  //Таймер бновления стэка для погоды каждые пол часа в асинхронном режиме
  var timerWeather = setInterval(function() {
  	weatherFunction(false);
  }, 1800 * 1000);

  //Таймер бновления стэка для погоды каждые два часа в асинхронном режиме
  var timerBread = setInterval(function() {
  	breadFunction(false);
  }, 7200 * 1000);

  var weatherStack = [], // Создаем массив для хранения результата асинхронной функции парсинга погоды.
      historyStack = []; // Создаем массив для хранения результата асинхронной функции парсинга истории "Хлеб наш насущный".

  //Функция для обновления стэка и вывода погоды пользователю
  function weatherFunction(messageChatId) {
  	var url = "http://www.wunderground.com/cgi-bin/findweather/getForecast?&query=Saransk";
  	request(url, function (error, response, body) {
  		if (!error) {
  			var $ = cheerio.load(body),
  			temperature = $("[data-variable='windchill'] .wx-value").html(),
  			bufer = "Температура воздуха (с учетом ветра)  " + temperature + "\xB0C";
  			if (weatherStack.length > 10) {
          weatherStack = []; //Очищаем, если размер стэка больше 10
        }
  			weatherStack.push(bufer);
  			if (messageChatId) {
  				bot.sendMessage(messageChatId, bufer);
  			}
  		}
  	});
  }

  //Функция для обновления стэка и вывода истории с "Хлеб наш насущный"
  function breadFunction(messageChatId) {
    var url = "http://russian-odb.org/today/";
    request(url, function (error, response, body) {
      if (!error) {
        var $ = cheerio.load(body),
            getText = $(".verse-box").text() + '\n \n' +
                   $('.post-content').text().replace(/\s+/g, " ") + '\n \n' +
                   $('.thought-box').text();
         if (historyStack.length > 4) {
           historyStack = []; //Очищаем, если размер стэка больше 4
         }
   			historyStack.push(getText);
        if (messageChatId) {
          bot.sendMessage(messageChatId, getText);
        }
      }
    });
  }

/*Вспомогательные функции*/




bot.on('text', function(msg) {
/*Список часто-используемых переменных*/
  var messageChatId = msg.chat.id,
      messageText = msg.text;
/*Список часто-используемых переменных*/

  //Отправляем погоду в чат
  if (messageText.indexOf('/weather') === 0) {
		if (weatherStack.length > 0) {
			bot.sendMessage(messageChatId, weatherStack[weatherStack.length - 1]);
		} else {
			weatherFunction(messageChatId);
		}
	}

  //Отправляем истории из "Хлеб наш насущный"
  if (messageText.indexOf('/daylibread') === 0) {
		if (historyStack.length > 0) {
			bot.sendMessage(messageChatId, historyStack[historyStack.length - 1]);
		} else {
      breadFunction(messageChatId);
		}
	}

  //Авто-отправка погоды
  var job = new cron({
    cronTime: '00 00 08 * * 0-6',
    onTick: function() {
    weatherFunction(messageChatId);
  },
    start: true,
    timeZone: 'Europe/Moscow'
  });
  job.start();

  //Авто-отправка истории из "Хлеб наш насущный"
  var job = new cron({
    cronTime: '00 30 06 * * 0-6',
    onTick: function() {
    breadFunction(messageChatId);
  },
    start: true,
    timeZone: 'Europe/Moscow'
  });
  job.start();

  //Отправляем картинку в чат
  if (messageText.indexOf('/verse') === 0) {
    var randomPictureName = 'http://prort.ru/verse/' + getRandomInt(1, 70) + '.jpg',
        verse = request(randomPictureName);
    bot.sendPhoto(messageChatId, verse);
  }

  //Отправляем аудио в чат
  if (messageText.indexOf('/audio') === 0) {
    var audio1 = 'http://prort.ru/audio/audio1.mp3',
        audio2 = 'http://prort.ru/audio/audio2.mp3';
    bot.sendAudio(messageChatId, audio1);
    bot.sendAudio(messageChatId, audio2);
  }

  //Отправляем описание бота в чат
  if (messageText.indexOf('/about') === 0) {
    var about = 'Доступный функционал бота:' + '\n\n' +
                '- Ежедневный вывод наставления с журнала "Хлеб наш насущный"' + '\n' +
                '- Ежедневный вывод погоды в Саранске' + '\n' +
                '- Вывод песен в формате "mp3", которые учим на праздники' + '\n' +
                '- Вывод аккордов к этим песням' + '\n' +
                '- Вывод слов к этим песням' + '\n' +
                '- Вывод актуального курса валют' + '\n' +
                '- Вывод стиха из Библии в формате изображения по команде' + '\n\n' +
                'Показать полный список команд с описанием - /help' + '\n\n' +
                'Бот написан на языке программирования Javascript. Принимаются любые пожелания по развитию и поддержке бота.'+ '\n' +
                'Автор бота: https://vk.com/roman_tatarinov';
    bot.sendMessage(messageChatId, about);
  }

  //Отправляем список команд с описанием в чат
  if (messageText.indexOf('/help') === 0) {
    var commandList =
    '/about - описания бота' + '\n' +
    '/audio - вывод списка песен, которые мы учим к ближайшим праздникам' + '\n' +
    '/chords - вывод аккордов песен, которые мы учим' + '\n' +
    '/currency - курсы валют' + '\n' +
    '/daylibread - вывод истории журнала "Хлеб наш насущный"' + '\n' +
    '/lyrics - вывод теста песен, которые мы учим' + '\n' +
    '/verse - вывод случайного стиха из Библии' + '\n' +
    '/weather - температура воздуха в Саранске';
    bot.sendMessage(messageChatId, commandList);
  }


  //Отправляем в чат аккорды песен, которые выводятся в audio
  function chordsFunction() {
    var url = "http://bot.prort.ru/";
    request(url, function (error, response, body) {
      if (!error) {
        var $ = cheerio.load(body),
            getText = $('#chords').text();
        if (messageText.indexOf('/chords') === 0) {
          bot.sendMessage(messageChatId, getText);
        }
      }
    });
  }
  chordsFunction();

  //Отправляем в чат слова песен, которые выводятся в audio
  function lyricsFunction() {
    var url = "http://bot.prort.ru/";
    request(url, function (error, response, body) {
      if (!error) {
        var $ = cheerio.load(body),
            getText = $('#lyrics').text();
        if (messageText.indexOf('/lyrics') === 0) {
          bot.sendMessage(messageChatId, getText);
        }
      }
    });
  }
  lyricsFunction();

  //Создаем эхо-сервер
  function echoServer() {
    var firstLetter,
    arr = [
      'оброе утро',
      'обрый вечер',
      'оброй ночи',
      'обрых снов',
      'ладких снов',
      'покойной ночи',
      'ривет',
      'риятных снов',
      'лагословений',
      'ак дел',
      'ак настро'
    ];

    function sendEchoMessage(firstLetter) {
      bot.sendMessage(messageChatId, firstLetter + arr[i] + ', ' + msg.from.first_name);
    }

    for (var i = 0; i < arr.length; i++) {
      if( messageText.indexOf(arr[i]) !== -1 ) {
        switch(i) {
          case 0:
          case 1:
          case 2:
          case 3:
            firstLetter = 'Д';
            sendEchoMessage(firstLetter);
            break;
          case 4:
          case 5:
            firstLetter = 'С';
            sendEchoMessage(firstLetter);
            break;
          case 6:
          case 7:
            firstLetter = 'П';
            sendEchoMessage(firstLetter);
            break;
          case 8:
            firstLetter = 'Б';
            sendEchoMessage(firstLetter);
            break;
            case 9:
            case 10:
              bot.sendMessage(messageChatId, 'У меня все отлично. Тусуюсь вот на серверах :) Ты как?');
              break;
        }
      }
    }
  }
  echoServer();

});










//Создаем валютного бота
function currencyFunction() {

  var options = {
      host: "www.cbr.ru",
      port: 80,
      path: "/scripts/XML_daily.asp?"
  },
  content = "";

  bot.on('text', function(msg) {
      var messageDate = msg.date,
          messageUser = msg.from.username,
          messageChatId = msg.chat.id,
          messageText = msg.text;
      if (messageText.indexOf('/currency') === 0) {
          updateGlobalCurrencyList(messageChatId);
      }
  });

  function sendMessageByBot(aChatId, aMessage) {
      bot.sendMessage(aChatId, aMessage, { caption: 'I\'m a cute bot!' });
  }

  function updateGlobalCurrencyList(aMessageChatId) {
      var req = http.request(options, function(res) {
          res.setEncoding("utf8");
          res.on("data", function(chunk) {
              content += chunk;
          });
          res.on("end", function() {
              sendMessageByBot(aMessageChatId, shittyParseXML(content));
          });
      });
      req.end();
  }

  function generateBotAnswer(aCurrencyList) {
      var currencyTable = 'Актуальный курс валют:\n';
      currencyTable += '1 USD = ' + aCurrencyList.USD + ' ' + 'руб.' + '\n';
      currencyTable += '1 EUR = ' + aCurrencyList.EUR + ' ' + 'руб.' + '\n';
      return currencyTable;
  }

  function shittyParseXML(aAllXml) {
      var currencyList = {
          'USD': 0.0,
          'EUR': 0.0,
      };

      currencyList.USD = getCurrentValue('USD', aAllXml);
      currencyList.EUR = getCurrentValue('EUR', aAllXml);

      return generateBotAnswer(currencyList);
  }

  function getCurrentValue(aCurrency, aString) {
      var nominal = parseFloat(replaceCommasByDots(getStringBelow(aString.indexOf(aCurrency), 1, aString))),
          value = parseFloat(replaceCommasByDots(getStringBelow(aString.indexOf(aCurrency), 3, aString)));
      return (value / nominal).toFixed(4);
  }

  function removeTags(aString) {
    return aString.replace(/(<([^>]+)>)/ig, '');
  }

  function getStringBelow(aStart, aBelow, aString) {
    var textSize = aString.length,
        countOfLineEndings = 0,
        getLineWith = 0;

    for (var i = aStart; i < textSize; ++i) {
        if (countOfLineEndings === aBelow) {
            getLineWith = i;
            break;
        }
        if (aString[i] === '\n') {
           countOfLineEndings++;
        }
    }
    return getLineFromXml(getLineWith, aString);
  }

  function replaceCommasByDots(aString) {
    return aString.replace(',', '.');
  }

  function getLineFromXml(aStart, aString) {
    var textSize = aString.length,
        targetString = '';
    for (var i = aStart; i < textSize; ++i) {
        if (aString[i] === '\n') {
            break;
        }
        targetString += aString[i];
    }
    return removeTags(targetString.trim());
  }

}

//Запускаем валютного бота
currencyFunction();

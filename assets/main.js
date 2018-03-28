$(function () {
  var loaderMessage = '<div class="loader">Relax! Jessica is now performing sentimental analysis on the latest ticket response...</div>'
  $('#content').html(loaderMessage);
  var client = ZAFClient.init();
  client.invoke('resize', {
    width:'100%',
    height:'220px'
  });
  var token = "";
  client.metadata().then(function(metadata) {
    token = metadata.settings.token;
    console.log("Token value from metadata is " + token);
  });

  client.get('ticket.requester.id').then(
    function(data){
      var user_id = data['ticket.requester.id'];

      client.get('ticket.comments.0.author.id').then(
        function(data){

          var latest_comment_author_id = data['ticket.comments.0.author.id'];

          if(user_id === latest_comment_author_id){
            client.get('ticket.comments.0.value').then(
                function(data){
                  var latestComment = data['ticket.comments.0.value'];
                  console.log("Token value is " + token);
                  getSentimentScore(client, extractContent(latestComment), token);
                }
            );

          } else {
            showNoSentimentScoreInfo(null, null);
          }
        }
      );
    }
  );
});

function extractContent(value){
  var div = document.createElement('div');
  div.innerHTML = value;
  return div.textContent || div.innerText;
}

function getSentimentScore(client, ticketText, token) {
  var settings = { url: "https://whispering-retreat-36489.herokuapp.com/sentimentalanalysis", // headers: {"x-auth": token},
    headers: {"Authorization": "Bearer {{setting.token}}"},
    secure: true, 
    type: "POST", 
    contentType: "application/json", 
    data: JSON.stringify({ text: ticketText }
    ) };

  console.log('Settings data is ' + JSON.stringify(settings));
  client.request(settings).then(
    function(data) {
      var sentimentScoreResponse = JSON.parse(data);
      var sentimentScore = sentimentScoreResponse.sentimentScore || 0;
      var sentimentComparativeScore = sentimentScoreResponse.comparativeScore || 0;
      var sentimentImage = getSentimentImageURL(sentimentComparativeScore || 0);
      showSentimentScoreInfo(sentimentScore, sentimentComparativeScore, sentimentImage);
    },
    function(response){
      showError(response);
    }
  );
}

function showSentimentScoreInfo(sentimentScore, comparativeScore, sentimentImage){
  var sentiment_score_data = {
    'sentimentScore': sentimentScore,
    'comparativeScore': comparativeScore.toFixed(2),
    'sentimentImage': sentimentImage,
    'sentimentScorePercentage': ((comparativeScore / 5) * 100).toFixed(2)
  };

  var source = $('#sentiment-score-template').html();
  var template = Handlebars.compile(source);
  var html = template(sentiment_score_data);
  $('#content').html(html);
}

function showNoSentimentScoreInfo(sentimentScore, comparativeScore){
  var sentiment_score_data = {
    'sentimentScore': sentimentScore,
    'comparativeScore': comparativeScore
  };
  var source = $('#no-sentiment-score-template').html();
  var template = Handlebars.compile(source);
  var html = template(sentiment_score_data);
  $('#content').html(html);
}

function getSentimentImageURL(comparativeScore) {
 if (comparativeScore > 0) { // happy
   return "images/happy.png";
 }
 if (comparativeScore < 0) { // angry
   return "images/angry.png";
 }
 // neutral
 return "images/confused.png";
}

function showError(response){
  var error_data = {
    'status': response.status,
    'statusText': response.statusText
  };

  var source = $('#error-template').html();
  var template = Handlebars.compile(source);
  var html = template(error_data);
  $('#content').html(html);
}

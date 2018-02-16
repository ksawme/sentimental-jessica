$(function () {
  var loaderMessage = '<div class="loader">Relax! Jessica is performing sentimental analysis on the latest ticket response...</div>'
  $('#content').html(loaderMessage);
  var client = ZAFClient.init();
  client.invoke('resize', {
    width:'100%',
    height:'220px'
  });
  client.get('ticket.requester.id').then(
    function(data){
      var user_id = data['ticket.requester.id'];

      client.get('ticket.comments.0.author.id').then(
        function(data){

          var latest_comment_author_id = data['ticket.comments.0.author.id'];

          //console.log(`Requester ID is ${user_id} & Last Comment is by ${latest_comment_author_id}`);
          if(user_id === latest_comment_author_id){
            //console.log('Last ticket comment is from the requester');
            client.get('ticket.comments.0.value').then(
                function(data){
                  var latestComment = data['ticket.comments.0.value'];
                  getSentimentScore(client, extractContent(latestComment));
                }
            );

          } else {
            showNoSentimentScoreInfo(null, null);
            //console.log('Last ticket comment is from non requester');
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

function getSentimentScore(client, ticketText) {
  var settings = {
  //url: 'http://localhost:3000/sentimentScoreZendesk',
  url: 'https://whispering-retreat-36489.herokuapp.com/sentimentScoreZendesk',
  headers: {"Authorization": "Bearer PyOAYC3N62gqpf"},
  type: 'POST',
  contentType: 'application/json',
  data: JSON.stringify({"text": ticketText})
};

  client.request(settings).then(
    function(data) {
      var sentimentScoreResponse = JSON.parse(data);
      var sentimentScore = sentimentScoreResponse.sentimentScore || 0;
      var sentimentComparativeScore = sentimentScoreResponse.comparativeScore || 0;
      var sentimentImage = sentimentScoreResponse.sentimentImage;
      showSentimentScoreInfo(sentimentScore, sentimentComparativeScore, sentimentImage);

    },
    // function(response) {
    //   console.log(response);
    // }
  );
}

function requestUserInfo(client, id){
  var settings = {
    url: '/api/v2/users/' + id + '.json',
    type:'GET',
    dataType: 'json'
  }

  client.request(settings).then(
    function(data){
      showInfo(data);
    },
    function(response){
      showError(data);
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

function showInfo(data){
  var requester_data = {
    'name': data.user.name,
    'email': data.user.email,
    'phone': data.user.phone,
    'tags': data.user.tags,
    'created_at': formatDate(data.user.created_at),
    'last_login_at': formatDate(data.user.last_login_at)
  };

  var source = $('#requester-template').html();
  var template = Handlebars.compile(source);
  var html = template(requester_data);
  $('#content').html(html);
}

function showError(response){
  var error_data = {
    'status': response.data,
    'statusText': response.statusText
  };

  var source = $('#error-template').html();
  var template = Handlebars.compile(source);
  var html = template(error_data);
  $('#content').html(html);
}


function formatDate(date) {
  var cdate = new Date(date);
  var options = {
    year: "numeric",
    month: "short",
    day: "numeric"
  };
  date = cdate.toLocaleDateString("en-us", options);
  return date;
}

var ip = 'http://13.125.252.241:51154';

$(document).on('deviceready', function() {
	FCMPlugin.onNotification(function(data) {
		if(data.status == 'match') {
			location.href = './orderMatched.html?personNum=' + data.personNum + '&orderNum=' + data.orderNum;
		}
	});
});
$(document).ready(function() {
	var orderStatus;
	var mainAddress;

	if(window.localStorage.getItem("mainAddress") && window.sessionStorage.getItem("orderStatus")) {
		mainAddress = JSON.parse(window.localStorage.getItem("mainAddress"));
		orderStatus = JSON.parse(window.sessionStorage.getItem("orderStatus"));
	}
	else {
		alert('오류입니다');
		window.history.back();
	}

	//주문후 뒤로가기시 메인페이지로 돌아가기
	// if(window.sessionStorage.getItem("orderResult")) {
	// 	window.sessionStorage.removeItem("orderResult");
	// 	history.go(-(history.length - 2));
	// }

	$('#delAddr').html(mainAddress["areaAddress"]);
	$('#delRoadAddr').html('[도로명] ' + mainAddress["roadAddress"]);
	$('#paymentPrice').html(numberWithCommas(orderStatus["totalPrice"]) + ' 원');
	$('#detailPrice').html('주문금액 ' + numberWithCommas(orderStatus["totalPrice"]) + '원');

	//가격숫자에 콤마 추가하는 함수
	function numberWithCommas(num) {
    	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	$('.wTime').click(function() {
		$('.wTime').removeClass('active');
		$(this).addClass('active');
		$('#waitingTime').val(parseInt($(this).html()));
	});

	//요청사항 글자수제한 함수
	$('#require').keyup(function() {
		var inputLength = $(this).val().length;

		if(inputLength <= 40)
			$('#inputLength').html(inputLength);
	});

	//주문결정
	$('#payment').click(function() {
		if($('#waitingTime').val() == '') {
			alert('대기시간을 선택해 주세요');
			return;
		}

		FCMPlugin.getToken(function(token) {    //푸시메시지를 위해 기기의 번호 얻음
			$.ajax({
				url: ip + '/orderDecide',
				type: 'GET',
				dataType: "jsonp",
				data: {
					mainAddress: JSON.stringify(mainAddress),
					orderStatus: JSON.stringify(orderStatus),
					phone: $('#phone').val(),
					require: $('#require').val(),
					waitingTime: $('#waitingTime').val(),
					deviceID: token
				},
				success: function(data) {
					// window.sessionStorage.setItem("orderResult", "true");

					if(data.status == 'complete') {
						location.href = './orderComplete.html?personNum=' + data.personNum + '&orderNum=' + data.orderNum;
					}
					else if(data.status == 'match') {
						location.href = './orderMatched.html?personNum=' + data.personNum + '&orderNum=' + data.orderNum;
					}
					else if(data.status == 'wait') {
						location.href = './orderWaited.html';
					}
				},
				error: function(error) {
					alert(JSON.stringify(error));
				}
			});
		});
	});
});
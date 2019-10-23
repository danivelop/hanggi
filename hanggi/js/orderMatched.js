$(document).ready(function() {
	var nowLocation = decodeURI(window.location.href);
	var parameters = (nowLocation.slice(nowLocation.indexOf('?') + 1, nowLocation.length)).split('&');
	var personNum = parameters[0].split('=')[1];
	var orderNum = parameters[1].split('=')[1];

	$.ajax({
		url: ip + '/getMyMatchedOrder',
		type: 'GET',
		dataType: "jsonp",
		data: {
			personNum: personNum,
			orderNum: orderNum
		},
		success: function(data) {
			var orderTime = new Date(data[0][0]["orderTime"]);

			//배달정보 삽입
			$('.currentTime').html(orderTime.getFullYear() + '-' + (orderTime.getMonth() + 1) + '-' + orderTime.getDate() + ' ' + (orderTime.getHours() < 12 ? '오전 ' + orderTime.getHours() : '오후 ' + (orderTime.getHours() == 12 ? orderTime.getHours() : orderTime.getHours() - 12)) + ':' + orderTime.getMinutes());
			$('.totalPrice').html(numberWithCommas(data[0][0]["odptotalprice"]) + '원');
			$('.phone').html(data[0][0]["odpphone"]);
			$('.address').html(data[0][0]["odpaddr"]);
			$('.require').html(data[0][0]["odprequire"]);

			//메뉴 파싱
			for(var i=0;i<data[1].length;i++) {
				var itemStr = '';
				var mTotalPrice = data[1][i]["menuPrice"];

				//메뉴이름과 가격 파싱
				itemStr += '<ul>' +
								'<li class="menuInfo list_ul">' +
									'<h5 class="list_left">' + data[1][i]["menuName"] + '</h5>' +
									'<h5 class="list_right menuTotalPrice"></h5>' +
								'</li>' +
								'<li class="menuInfo list_ul">' +
									'<h5 class="list_left">가격</h5>' +
									'<h5 class="list_right">' + numberWithCommas(data[1][i]["menuPrice"]) + '원</h5>' +
								'</li>';

				//옵션이 있는경우
				if(data[1][i]["options"]) {
					var optionPrice = 0;
					var optionStr = '';

					for(var j=0;j<data[1][i]["options"].length;j++) {
						optionPrice += data[1][i]["options"][j]["optionPrice"];
						optionStr += '<h6>' + data[1][i]["options"][j]["optionName"] + '</h6>';
					}
					mTotalPrice += optionPrice;

					itemStr += '<li class="menuInfo list_ul">' +
									'<h5 class="list_left">옵션</h5>' +
									'<h5 class="list_right">+' + numberWithCommas(optionPrice) + '원</h5>' +
									'<div class="optionInfo list_right">' +
										optionStr +
									'</div>' +
								'</li>';
				}

				//수량부분 파싱
				itemStr += '<li class="menuInfo list_ul">' +
								'<h5 class="list_left">수량</h5>' +
								'<h5 class="list_right">' + data[1][i]["odpmquantity"] + '개</h5>' +
							'<li>' +
							'</ul>';

				//수량을 곱해 메뉴 총금액 구함
				mTotalPrice *= data[1][i]["odpmquantity"];

				$('<li></li>').addClass('orderMenu').html(itemStr).appendTo('#menuList').find('.menuTotalPrice').html(numberWithCommas(mTotalPrice) + '원');
			}
		},
		error: function(error) {
			alert(JSON.stringify(error));
		}
	});

	//가격숫자에 콤마 추가하는 함수
	function numberWithCommas(num) {
    	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}
});
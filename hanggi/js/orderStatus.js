$(document).ready(function() {
	var totalPrice = 0;   //전체 총금액 저장하는 변수
	var orderStatus = {};

	if(window.sessionStorage.getItem("orderStatus")) {
		orderStatus = JSON.parse(window.sessionStorage.getItem("orderStatus"));
		totalPrice = orderStatus["totalPrice"];

		if(orderStatus["menu"].length != 0) {
			$('#menus').empty();  //기존 주문현황 비우기
			$('#restaurantName').html(orderStatus["restName"]);

			//메뉴 파싱하는 부분
			for(var i=0;i<orderStatus["menu"].length;i++) {
				var itemStr = 	'<img src="image/cancleThin.png" class="removeMenu" />' +
								'<h2 class="menuName">' + orderStatus["menu"][i]["menuName"] + '</h2>' +
								'<ul class="menuPrice">' +
									'<li>' +
										'<h3 class="priceTitle">가격</h3>' +
										'<h3 class="priceInfo">' + numberWithCommas(parseInt(orderStatus["menu"][i]["originalPrice"])) + '원</h3>' +
									'</li>' +
								'</ul>';

				if(orderStatus["menu"][i]["options"] != 'false') {
					itemStr += '<ul class="menuOption">';

					for(var j=0;j<orderStatus["menu"][i]["options"].length;j++) {
						itemStr += '<li>' +
										'<h3 class="optionTitle">' + orderStatus["menu"][i]["options"][j]["optionTitle"] + '</h3>';

						var optionPrice = 0;
						var optionStr = '<div class="optionInfo">';

						for(var k=0;k<orderStatus["menu"][i]["options"][j]["option"].length;k++) {
							optionPrice += parseInt(orderStatus["menu"][i]["options"][j]["option"][k]["optionPrice"]);
							optionStr += '<h4>(' + orderStatus["menu"][i]["options"][j]["option"][k]["optionName"] + ')</h4>';
						}
						optionStr += '</div';

						itemStr += '<h3 class="optionPrice">+' + numberWithCommas(optionPrice) + '원</h3>' +
									optionStr +
									'</li>';
					}

					itemStr += '</ul>';
				}

				itemStr += '<div class="quantityBox">' +
								'<span class="quantityTitle">수량</span>' +
								'<ul class="list_ul list_right">' +
									'<li class="list_left">' +
									    '<img class="minus" data-index="' + i + '" src="image/minus.png" />' +
									'</li>' +
									'<li class="list_left">' +
									    '<input type="number" class="quantity" data-index="' + i + '" value="' + orderStatus["menu"][i]["quantity"] + '" disabled />' +
									'</li>' +
									'<li class="list_left">' +
									    '<img class="plus" data-index="' + i + '" src="image/plus.png" />'+
									'</li>' +
								'</ul>' +
							'</div>' +
							'<div class="opTotalPriceWrap"' +
								'<h3 class="opTPTitle">소계</h3>' +
								'<h3 class="opTP">' + numberWithCommas(parseInt(orderStatus["menu"][i]["totalPrice"])) + '원</h3>' +
							'</div>';

				$('<div></div>').addClass('menu').attr('data-index', orderStatus["menu"][i]["menuIndex"]).html(itemStr).appendTo($('#menus'));
			}

			$('.tP').html(numberWithCommas(totalPrice) + '원');
		}
		else {
			$('#restaurantName').css('display', 'none');
		}
	}
	else{
		$('#restaurantName').css('display', 'none');
	}

	//가격숫자에 콤마 추가하는 함수
	function numberWithCommas(num) {
    	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	//수량선택 함수
	$('#menus').on('click', '.minus', function() {
		var dataIndex = parseInt($(this).attr('data-index'));
		var menuPrice = parseInt(orderStatus["menu"][dataIndex]["totalPrice"]) / parseInt(orderStatus["menu"][dataIndex]["quantity"]);  //수량이 1개일때 메뉴의 오리지날가격과 옵션가격만 합친금액 구하는변수
		var menuTp = menuPrice;

		if(parseInt($('.quantity[data-index=' + dataIndex + ']').val()) > 1) {
			$('.quantity[data-index=' + dataIndex + ']').val(parseInt($('.quantity[data-index=' + dataIndex + ']').val()) - 1);  //메뉴 수량칸 갯수 바꿈
			orderStatus["menu"][dataIndex]["quantity"] = parseInt(orderStatus["menu"][dataIndex]["quantity"]) - 1;   //orderStatus객체의 수량바꿈
			menuTp *= parseInt(orderStatus["menu"][dataIndex]["quantity"]);
			orderStatus["menu"][dataIndex]["totalPrice"] = menuTp;           //orderStatus객체의 총가격 바꿈

			$(this).parent().parent().parent().parent().find('.opTP').html(numberWithCommas(menuTp) + '원');   //수량 변경한 각 메뉴의 총가격 바꿈

			getTotalPrice();
		}
	});
	$('#menus').on('click', '.plus', function() {
		var dataIndex = parseInt($(this).attr('data-index'));
		var menuPrice = parseInt(orderStatus["menu"][dataIndex]["totalPrice"]) / parseInt(orderStatus["menu"][dataIndex]["quantity"]);
		var menuTp = menuPrice;

		$('.quantity[data-index=' + dataIndex + ']').val(parseInt($('.quantity[data-index=' + dataIndex + ']').val()) + 1);
		orderStatus["menu"][dataIndex]["quantity"] = parseInt(orderStatus["menu"][dataIndex]["quantity"]) + 1; 
		menuTp *= parseInt(orderStatus["menu"][dataIndex]["quantity"]);
		orderStatus["menu"][dataIndex]["totalPrice"] = menuTp;

		$(this).parent().parent().parent().parent().find('.opTP').html(numberWithCommas(menuTp) + '원');

		getTotalPrice();
	});

	//주문현황의 총가격 바꿈
	function getTotalPrice() {
		totalPrice = 0;
		for(i=0;i<orderStatus["menu"].length;i++) {
			totalPrice += parseInt(orderStatus["menu"][i]["totalPrice"]);
		}
		$('.tP').html(numberWithCommas(totalPrice) + '원');
		orderStatus["totalPrice"] = totalPrice;

		window.sessionStorage.setItem("orderStatus", JSON.stringify(orderStatus));
	}

	//메뉴삭제
	$('.removeMenu').click(function() {
		var menuIndex = $(this).parent().attr('data-index');

		for(var i=0;i<orderStatus["menu"].length;i++) {
			if(orderStatus["menu"][i]["menuIndex"] == menuIndex) {
				$(this).parent().remove();

				orderStatus["menu"].splice(i, 1);
				getTotalPrice();

				break;
			}
		}
	});

	//주문하기 버튼 이벤트
	$('#goOrder').click(function() {
		if(orderStatus["menu"].length == 0) {
			alert('주문현황이 없습니다.');
		}
		else {
			if(orderStatus["totalPrice"] >= orderStatus["minPriceEach"]) {
				location.href = 'orderDecide.html';
			}
			else {
				alert('해당 식당의 1인당 최소주문금액은 ' + orderStatus["minPriceEach"] + '입니다.');
			}
		}
	});
});
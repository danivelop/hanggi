$(document).ready(function() {
	var nowPosition = 0;
	var myOrder = [];

	/*초기화*/
	$('.itemTitle').each(function(index) {
		$(this).attr('data-index', index);
	});
	$('.item').each(function(index) {
		$(this).attr('data-index', index);
	});
	$('#blankNav').css('height', $('#mainNav').css('height'));
	$('#selectOptionWrap').css({
		height: window.innerHeight
	});
	$('#includeMenu').css('width', screen.width - 40);

	//URI주소에서 get파라미터 정보 읽기
	var nowLocation = decodeURI(window.location.href);
	var parameters = (nowLocation.slice(nowLocation.indexOf('?') + 1, nowLocation.length)).split('&');

	//식당번호 얻기
    var restaurantNum = parameters[0].split('=')[1];

	//아이템항목 슬라이더
	$.fn.itemPivot = function() {
		var $target = $(this);
		var $items = $target.children();
		var $container = $target.parent();
		var itemHeight = window.innerHeight - parseInt($('#headerWrap').css('height')) - parseInt($('#mainNav').css('height')) - 1;

		if(parseInt($('.item[data-index=0]').css('height')) > window.innerHeight - parseInt($('#headerWrap').css('height')) - parseInt($('#mainNav').css('height'))) {
			$container.css('height', $('.item[data-index=0]').css('height'));
		}
		else {
			$container.css('height', window.innerHeight - parseInt($('#headerWrap').css('height')) - parseInt($('#mainNav').css('height')) - 1);
		}

		$container.css({
			overflow: 'hidden',
			position: 'relative',
			width: screen.width
		});
		$target.css({
			width: $items.length * screen.width,
			position: 'absolute'
		});
		$items.css({
			float: 'left',
			width: screen.width,
			zIndex: '10'
		});

		var originalLeft = 0;
		var originalTop = 0;
		var oldLeft = 0;
		var oldTop = 0;
		var isScroll = false;

		$container.bind('touchstart', function(e) {
			var event = e.originalEvent;

			oldLeft = originalLeft = event.touches[0].clientX;
			oldTop = originalTop = event.touches[0].clientY;
		});
		$container.bind('touchmove', function(e) {
			var event = e.originalEvent;
			var distance = oldLeft - event.touches[0].clientX;
			oldLeft = event.touches[0].clientX;
			oldTop = event.touches[0].clientY;

			//스크롤중에는 메뉴목록 옆으로 옮기는것 방지하도록
			if(Math.abs(originalLeft - oldLeft) > screen.width / 8 && Math.abs(originalLeft - oldLeft) > Math.abs(originalTop - oldTop)) {
				isScroll = false;

				if((nowPosition != 0 || distance > 0) && (nowPosition != $items.length - 1 || distance < 0)) {
					$target.css('left', parseInt($target.css('left')) - distance);
				}
				e.preventDefault(); //스크롤 방지
			}
			else {
				isScroll = true;
			}
		});
		$container.bind('touchend', function(e) {
			if(!isScroll) {
				var event = e.originalEvent;

				function movePosition(direction) {
					var changePosition = nowPosition + direction;

					if (0 <= changePosition && changePosition < $items.length) {
					    nowPosition = changePosition;
					}
				}

				if (originalLeft - oldLeft > screen.width / 3) {
				    movePosition(+1);
				} else if (originalLeft - oldLeft < -screen.width / 3) {
				    movePosition(-1);
				}

				moveItemPosition(nowPosition);
			}
		});
	};

	$('#itemSlider').itemPivot();

	//아이템항목 이동함수
	function moveItemPosition(direction) {
		$('#itemSlider').animate({
			left: -direction * screen.width
		}, 170);
		if(parseInt($('.item[data-index=' + direction + ']').css('height')) > window.innerHeight - parseInt($('#headerWrap').css('height')) - parseInt($('#mainNav').css('height'))) {
			$('#sliderWrap').css('height', parseInt($('.item[data-index=' + direction + ']').css('height')) + parseInt($('#orderStatusBtn').css('height')));
		}
		else {
			$('#sliderWrap').css('height', window.innerHeight - parseInt($('#headerWrap').css('height')) - parseInt($('#mainNav').css('height')) - 1);
		}

		$('.itemTitle[data-index=' + direction + ']').css('color', 'rgb(0, 0, 0)');
		$('.itemTitle[data-index!=' + direction + ']').css('color', 'rgb(180, 180, 180)');

		moveUnverBar(direction);
	}
	//아이템항목 언더바 이동함수
	function moveUnverBar(direction) {
		$('#underBar').css('left', (33.33 * direction) + '%');
	}

	//네비게이션 클릭시 아이템항목 이동
	$('.itemTitle').click(function() {
		nowPosition = parseInt($(this).attr('data-index'));
		moveItemPosition(nowPosition);
	});

	//스크롤 아래까지 내렸을때 네비게이션은 남고 아이템항목만 볼수있는 코드
	$('body').scroll(function(e) {
		if($('#mainHeader').offset().top < 0) {
			$('#headerTitle').css('color', 'rgba(0, 0, 0, 1.0)');
		}
		else {
			$('#headerTitle').css('color', 'rgba(0, 0, 0, 0)');
		}

		if($('#blankNav').offset().top <= parseInt($('#headerWrap').css('height'))) {
			$('#mainNav').css({
				position: 'fixed',
				top: $('#headerWrap').css('height'),
				left: '0px'
			});
		}
		else {
			$('#mainNav').css({
				position: 'absolute',
				top: '0px',
				left: '0px'
			});
		}
	});

	//주문현황 페이지로 가는 이벤트
	// $('#orderStatusBtn').click(function() {
	// 	if(orderStatus["menu"].length != 0) {
	// 		location.href= "orderStatus.html";
	// 	}
	// 	else {
	// 		alert('주문현황이 없습니다.');
	// 	}
	// });

	//메뉴선택 함수
	// var isOption = false;
	// var menuNum = 0;
	// var menuName = '';
	// var originalPrice = 0;
	// var totalPrice = 0;
	// var orderStatus = {};
	// var isFirstOrder = true;    //주문현황에 있는 메뉴가 현재 보고있는 식당에서 주문한 메뉴인지 검사
	// var menuIndex = 0;   //주문현황 내에서 각 메뉴의 고유한번호(메뉴를 삭제할때 e프라이머리키의 메뉴번호로 삭제하게 되면 같은메뉴를 다른옵션으로 2개 주문했을때 동시에 삭제됨)

	//장바구니에 다른식당에서 주문한것이 있는지 검사
	// if(window.sessionStorage.getItem("orderStatus")) {     //기존에 주문현황이 있는경우
	// 	orderStatus = JSON.parse(window.sessionStorage.getItem("orderStatus"));

	// 	if(orderStatus["restNum"] != restaurantNum) {      //이전에 주문현황에 있는 주문이 현재 주문하려는 식당하고 다른곳일 경우
	// 		isFirstOrder = false;
	// 	}
	// 	if(orderStatus["menu"].length != 0) {
	// 		menuIndex = parseInt(orderStatus["menu"][parseInt(orderStatus["menu"].length) - 1]["menuIndex"]) + 1;
	// 	}
	// 	else {
	// 		isFirstOrder = true;
	// 	}
	// }
	// else {   //어플 실행후로 주문 처음할때
	// 	orderStatus = {
	// 		"restNum": restaurantNum,
	// 		"restName": $('#headerTitle').html(),
	// 		"menu": []
	// 	};
	// }

	//메뉴선택 함수
	var isOption = false;
	var menuNum = 0;
	var menuName = '';
	var minPrice = 0;       //해당 식당의 전체 최소주문금액
	var minPriceEach = 0;   //해당 식당의 1인당 최소주문금액(orderStatus객체에 넣어 주문현황페이지에서 주문 가능한지 판단할때 쓰임)
	var originalPrice = 0;
	var orderTotalPrice = 0;    //모든메뉴의 총금액
	var totalPrice = 0;         //한 메뉴의 옵션포함 총금액
	var orderStatus = {};
	var isFirstOrder = true;    //주문현황에 있는 메뉴가 현재 보고있는 식당에서 주문한 메뉴인지 검사
	var menuIndex = 0;   //주문현황 내에서 각 메뉴의 고유한번호(메뉴를 삭제할때 e프라이머리키의 메뉴번호로 삭제하게 되면 같은메뉴를 다른옵션으로 2개 주문했을때 동시에 삭제됨)

	//현재 주문현황 정보 받아옴
	(function getCurrentOrderStatus() {
		if(window.sessionStorage.getItem("orderStatus")) {     //기존에 주문현황이 있는경우
			orderStatus = JSON.parse(window.sessionStorage.getItem("orderStatus"));
			orderTotalPrice = orderStatus["totalPrice"];
		}
		else {   //어플 실행후로 주문 처음할때
			orderStatus = {
				"restNum": restaurantNum,
				"restName": $('#headerTitle').html(),
				"totalPrice": 0,
				"minPrice": minPrice,
				"minPriceEach": minPriceEach,
				"menu": []
			};
		}
	})();

	if(orderStatus["menu"].length != 0) {
		menuIndex = parseInt(orderStatus["menu"][parseInt(orderStatus["menu"].length) - 1]["menuIndex"]) + 1;
	}

	$('#menuItem').on('click', '.menu', function() {
		isOption = $(this).attr('data-option');
		menuNum = $(this).attr('data-index');
		originalPrice = parseInt($(this).attr('data-menuPrice'));
		totalPrice = originalPrice;
		menuName = $(this).attr('data-menuName');

		$('#selectOptionWrap').css('display', 'block');
		$('.menuName').html($(this).attr('data-menuName'));
		$('.menuDesc').html($(this).attr('data-menuDesc'));
		$('.menuPrice').html('가격 : ' + numberWithCommas($(this).attr('data-menuPrice')) + '원');
		$('#totalPrice').val(totalPrice);
		$('#totalPriceText').html(numberWithCommas(totalPrice) + '원');
		$('#quantity').val(1);

		$('#optionInfo').empty();

		if(isOption == 'true') {
			$.ajax({
				url: ip + '/getOptions/' + $(this).attr('data-index'),
				type: 'GET',
				dataType: "jsonp",
				success: function(data) {
					var isCheck;
					var dataIndex;

					data.forEach(function(item, index) {
						if(index == 0) {
							var itemStr = '';

							item.forEach(function(options, index) {
								itemStr += '<h5 class="optionTitle">' + options.otinfo + '</h5>' +
											'<ul></ul>';

								$('<div></div>').addClass('optionType').attr({
									'data-index': options.otid,
									'isCheck': (options.otischeck ? true : false)
								}).html(itemStr).appendTo('#optionInfo');
								itemStr = '';
							});
						}
						else if(index == 1) {
							var itemStr = '';

							item.forEach(function(option, index) {
								isCheck = ($('.optionType[data-index=' + option.otid + ']').attr('isCheck') == 'true') ? true : false;
								dataIndex = $('.optionType[data-index=' + option.otid + ']').attr('data-index');

								itemStr += '<input id="' + option.opid + '" class="optionBox" type="' + (isCheck ? 'checkbox' : 'radio') + '" name="' + dataIndex + '" data-price="' + option.opprice + '" />' +
											'<label for="' + option.opid + '">' + option.opname + '</label>' +
											'<h6 class="optionPrice">+' + numberWithCommas(option.opprice) + '원</h6>';

								$('<li></li>').addClass('option').html(itemStr).appendTo('.optionType[data-index=' + option.otid + '] > ul');
								itemStr = '';
							});

							//옵션에서 라디오버튼은 첫번째항목 처음부터 체크하는 코드
							$('.optionType[isCheck=false]').each(function() {
								$(this).find('li.option').first().find('input.optionBox').attr('checked', 'checked');
							});
						}
					});
				},
				error: function(error) {
					alert(JSON.stringify(error));
				}
			});
		}
	});
	$('#optionBack').click(function() {
		$('#selectOptionWrap').css('display', 'none');
	});

	//옵션선택함수
	$('#optionInfo').on('change', '.optionBox', function() {
		getTotalPrice();
	});

	//수량선택 함수
	$('#minus').click(function() {
		if(parseInt($('#quantity').val()) > 1) {
			$('#quantity').val(parseInt($('#quantity').val()) - 1);

			getTotalPrice();
		}
	});
	$('#plus').click(function() {
		$('#quantity').val(parseInt($('#quantity').val()) + 1);

		getTotalPrice();
	});

	//장바구니담기 클릭시 주문현황에 추가
	// $('#includeMenu').click(function() {
	// 	if(!isFirstOrder) {   //기존에 주문현황이 있는경우(기존에 있는 주문현황이 다른식당인 경우)
	// 		if(confirm('이전의 주문은 삭제됩니다. 진행하시겠습니까?')) {
	// 			orderStatus = {
	// 				"restNum": restaurantNum,
	// 				"restName": $('#headerTitle').html(),
	// 				"menu": []
	// 			};
	// 			window.sessionStorage.setItem("orderStatus", JSON.stringify(orderStatus));
	// 			isFirstOrder = true;
	// 		}
	// 	}

	// 	if(isFirstOrder) {   //어플실행후 처음 주문하는 경우나 같은식당에서 주문했다가 다시 주문하는경우
	// 		if(isOption == 'true') {
	// 			var choiceMenu = {
	// 				"menuIndex": menuIndex,
	// 				"menuNum": menuNum,
	// 				"menuName": menuName,
	// 				"originalPrice": originalPrice,
	// 				"quantity": $('#quantity').val(),
	// 				"totalPrice": totalPrice,
	// 				"options": []
	// 			};

	// 			$('.optionType').each(function(index, item) {
	// 				var optionType = {
	// 					"optionTitle": $(item).find('.optionTitle').html(),
	// 					"option": []
	// 				};

	// 				$(item).find('.optionBox:checked').each(function(index, item) {
	// 					var option = {
	// 						"optionNum": $(item).attr('id'),
	// 						"optionName": $(item).parent().find('label').html(),
	// 						"optionPrice": $(item).attr('data-price')
	// 					};

	// 					optionType["option"].push(option);
	// 				});

	// 				choiceMenu["options"].push(optionType);
	// 			});

	// 			orderStatus["restNum"] = restaurantNum;
	// 			orderStatus["restName"] = $('#headerTitle').html();
	// 			orderStatus["menu"].push(choiceMenu);
	// 			window.sessionStorage.setItem("orderStatus", JSON.stringify(orderStatus));
	// 		}
	// 		else {
	// 			var choiceMenu = {
	// 				"menuIndex": menuIndex,
	// 				"menuNum": menuNum,
	// 				"menuName": menuName,
	// 				"originalPrice": originalPrice,
	// 				"quantity": $('#quantity').val(),
	// 				"totalPrice": totalPrice,
	// 				"options": false
	// 			}

	// 			orderStatus["restNum"] = restaurantNum;
	// 			orderStatus["restName"] = $('#headerTitle').html();
	// 			orderStatus["menu"].push(choiceMenu);
	// 			window.sessionStorage.setItem("orderStatus", JSON.stringify(orderStatus));
	// 		}
	// 		menuIndex++;   //주문현황내의 각 메뉴의 고유번호 변수 증가
	// 	}

	// 	$('#selectOptionWrap').css('display', 'none');
	// 	alert(window.sessionStorage.getItem("orderStatus"));
	// });

	//장바구니담기 클릭시 주문현황에 추가
	$('#includeMenu').click(function() {
		if(orderStatus["restNum"] != restaurantNum) {   //기존에 주문현황이 있는경우(기존에 있는 주문현황이 다른식당인 경우)
			if(orderStatus["menu"].length != 0) {
				if(confirm('이전의 주문은 삭제됩니다. 진행하시겠습니까?')) {
					orderStatus = {
						"restNum": restaurantNum,
						"restName": $('#headerTitle').html(),
						"totalPrice": 0,
						"minPrice": minPrice,
						"minPriceEach": minPriceEach,
						"menu": []
					};

					orderTotalPrice = 0;
					addMenu();
				}
			}
			else {    //이전에 다른식당에서 주문한적이 있지만 메뉴 전부 삭제하고 다른식당에서 주문하는 경우
				orderStatus = {
					"restNum": restaurantNum,
					"restName": $('#headerTitle').html(),
					"totalPrice": 0,
					"minPrice": minPrice,
					"minPriceEach": minPriceEach,
					"menu": []
				};

				orderTotalPrice = 0;
				addMenu();
			}
		}
		else {
			addMenu();
		}

		$('#selectOptionWrap').css('display', 'none');
		// alert(window.sessionStorage.getItem("orderStatus"));
	});

	//메뉴 추가함수
	function addMenu() {
		if(isOption == 'true') {
			var choiceMenu = {
				"menuIndex": menuIndex,
				"menuNum": menuNum,
				"menuName": menuName,
				"originalPrice": originalPrice,
				"quantity": $('#quantity').val(),
				"totalPrice": totalPrice,
				"options": []
			};

			$('.optionType').each(function(index, item) {
				var optionType = {
					"optionTitle": $(item).find('.optionTitle').html(),
					"option": []
				};

				$(item).find('.optionBox:checked').each(function(index, item) {
					var option = {
						"optionNum": $(item).attr('id'),
						"optionName": $(item).parent().find('label').html(),
						"optionPrice": $(item).attr('data-price')
					};

					optionType["option"].push(option);
				});

				choiceMenu["options"].push(optionType);
			});
		}
		else {
			var choiceMenu = {
				"menuIndex": menuIndex,
				"menuNum": menuNum,
				"menuName": menuName,
				"originalPrice": originalPrice,
				"quantity": $('#quantity').val(),
				"totalPrice": totalPrice,
				"options": false
			}
		}

		orderTotalPrice += totalPrice;

		orderStatus["restName"] = $('#headerTitle').html();   //ajax로 식당이름 받아오는데 ajax는 가장 나중에 실행되기 때문에 식당이름을 처음에 orderStatus객체에 못넣어서 지금 넣음
		orderStatus["totalPrice"] = orderTotalPrice;
		orderStatus["minPrice"] = minPrice;
		orderStatus["minPriceEach"] = minPriceEach;
		orderStatus["menu"].push(choiceMenu);
		window.sessionStorage.setItem("orderStatus", JSON.stringify(orderStatus));

		menuIndex++;   //주문현황내의 각 메뉴의 고유번호 변수 증가
	}

	//가격숫자에 콤마 추가하는 함수
	function numberWithCommas(num) {
    	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	//최소금액의 3분의1을 천원단위로 올림하는 함수
	function minPriceForOne(num) {
		minPriceEach = (typeof(num) == 'Number') ? num : parseInt(num);

		if(minPriceEach%1000 == 0 && minPriceEach/1000%3 == 0) {
			return minPriceEach = minPriceEach/3;
		}
		else {
			return minPriceEach = (Math.floor(minPriceEach/1000/3) + 1) * 1000;
		}
	}

	//총금액 구하는 함수
	function getTotalPrice() {
		totalPrice = originalPrice;

		$('.optionBox:checked').each(function(index, item) {
			totalPrice += parseInt($(item).attr('data-price'));
		});

		totalPrice *= parseInt($('#quantity').val());

		$('#totalPrice').val(totalPrice);
		$('#totalPriceText').html(numberWithCommas(totalPrice) + '원');
	}

	//서버로부터 식당 데이터 받아옴
	$.ajax({
		url: ip + '/getRestaurant/' + restaurantNum,
		type: 'GET',
		dataType: "jsonp",
		success: function(data) {
			data.forEach(function(item, index) {
				if(index == 0) {   //상단 식당정보 파싱부분
					$('.rstrtImg').attr('src', ip + '/' + item[0].rimg);
					$('#headerTitle').html(item[0].rname);

					var itemStr = '';

					itemStr += '<h1 id="rstrtName">' + item[0].rname + '</h1>' +
								'<h2 id="rstrtGrade">평점 4.2 / 리뷰 32</h2>' +
								'<div id="underLine"></div>' +
								'<h3 id="payment">결제방법&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp현장결제</h3>' +
								'<h4 id="paymentInfo">최소주문금액&nbsp&nbsp&nbsp&nbsp' + numberWithCommas(item[0].rminpri) + '원&nbsp&nbsp&nbsp/&nbsp&nbsp&nbsp1인 최소주문금액&nbsp' + numberWithCommas(minPriceForOne(item[0].rminpri)) + '원</h4>' +
								'<div id="favorites">좋아요</div>';

					minPrice = item[0].rminpri;
					$('#rstrtInfo').html(itemStr);
				}
				else if(index == 1) {    //메뉴중분류 파싱부분
					var itemStr = '';
					var count = 0;

					item.forEach(function(menus, index) {
						$('<div></div>').addClass('menuTitle').html(menus.mtinfo).appendTo('#menuItem');
						$('<div></div>').addClass('menus').attr({
							'id': 'subMenu' + count++,
							'data-index': menus.mtid
						}).html('<ul></ul>').appendTo('#menuItem');
					});
				}
				else if(index == 2) {    //각 메뉴의 중분류안에 메뉴항목 파싱부분
					var itemStr = '';

					item.forEach(function(menu, index) {
						itemStr = '';

						if(menu.mismain) {
							itemStr += '<div class="menu menu_main" data-index="' + menu.mid + '" data-option="' + (menu.misoption ? 'true' : 'false') + '" data-menuName="' + menu.mname + '" data-menuDesc="' + menu.minfo + '" data-menuPrice="' + menu.mprice + '">' +
											'<img src="image/kimchistew.jpg" class="menu_main_img" />' +
											'<div class="menu_main_info">' +
												'<p class="menu_main_name">' + menu.mname + '</p>' +
												'<p class="menu_main_price">' + numberWithCommas(menu.mprice) + '원</p>' +
											'</div>' +
										'</div>';

							$('<li></li>').addClass('list_left').html(itemStr).appendTo('#mainMenu > ul');

							itemStr = '';
						}

						itemStr += '<p class="menu_sub_name">' + menu.mname + '</p>';

						if(menu.minfo != '') {
							itemStr += '<p class="menu_sub_info">- ' + menu.minfo + '</p>';
						}

						itemStr += '<p class="menu_sub_price">' + numberWithCommas(menu.mprice) + '원</p>';

						$('<li></li>').addClass('menu menu_sub').attr({
							'data-index': menu.mid,
							'data-option': (menu.misoption ? 'true' : 'false'),
							'data-menuName': menu.mname,
							'data-menuDesc': menu.minfo,
							'data-menuPrice': menu.mprice
						}).html(itemStr).appendTo('.menus[data-index=' + menu.mtid + '] > ul');
					});
				}
			});

			//메인메뉴항목 칸 높이설정(ajax는 가장 마지막에 실행되므로)
			$('.menu_main').css('height', $('.menu_main').css('width'));
			$('.menu_main_info').css('marginTop', parseInt($('.menu_main_info').css('height')) / -2);

			//ajax로 메뉴를 얻어왔으니 메뉴화면 높이값을 조정해야함
			moveItemPosition(0);
		},
		error: function(error) {
			alert(JSON.stringify(error));
		}
	});
});
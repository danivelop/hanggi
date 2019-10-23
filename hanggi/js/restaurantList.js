$(document).ready(function() {
	var oldDirection = 0;

	/*초기화*/
	$('.menuTitle').each(function(index) {
		$(this).attr('data-index', index);
	});
	$('.menu').each(function(index) {
		$(this).attr('data-index', index);
	});

	//주문현황 있으면 주문현황 버튼 보이도록
	if(window.sessionStorage.getItem("orderStatus")) {
		orderStatus = JSON.parse(window.sessionStorage.getItem("orderStatus"));

		if(orderStatus["menu"].length != 0) {
			$('#orderStatus').css('display', 'block');
		}
	}

	//주문완료후 index페이지로 돌아온경우 주문결과 보여줌
	if(window.sessionStorage.getItem("orderResult")) {
		var orderResult = JSON.parse(window.sessionStorage.getItem("orderResult"));

		if(orderResult.status == 'complete') {
			location.href = 'orderComplete.html?personNum=' + orderResult.personNum + '&orderNum=' + orderResult.orderNum;
		}
		else if(orderResult.status == 'match') {
			location.href = 'orderMatched.html?personNum=' + orderResult.personNum + '&orderNum=' + orderResult.orderNum;
		}
		else if(orderResult.status == 'wait') {
			location.href = 'orderWaited.html';
		}
	}

	//메뉴타입 함수
	var nowLocation = location.href;
	var menuType = parseInt((nowLocation.slice(nowLocation.indexOf('?') + 1, nowLocation.length)).split('=')[1]);
	var menuArray = ['한식', '분식', '돈까스', '중국집', '야식', '찜·탕'];
	$('#headerTitle').html(menuArray[menuType]);
	
	//메뉴이름 슬라이더
	$.fn.menuTitlePivot = function() {
		var $target = $(this);
		var $items = $target.find('.menuTitle');
		var $container = $target.parent();
		var textSliderWidth = 0;

		$items.each(function(index) {
			textSliderWidth += parseInt($(this).css('width'));
		});
		$target.css({
			width: textSliderWidth + 4,
			position: 'absolute',
			left: '0px',
			transitionDuration: '0.3s'
		});
		$container.css({
			width: screen.width,
			height: parseInt($target.css('height')) + parseInt($('#menuTitleUnderBar').css('height')),
			backgroundColor: 'white',
			overflow: 'hidden',
			position: 'fixed',
			top: $('#mainHeader').css('height'),
			zIndex: '99'
		});
		$('#menuTitleUnderBar').css({
			top: $target.css('height')
		});

		$items.click(function() {
			menuType = parseInt($(this).attr('data-index'));
			moveMenuPosition(menuType);
		});
	};

	//메뉴 슬라이더
	$.fn.menuPivot = function() {
		var $target = $(this);
		var $items = $target.children();
		var $container = $target.parent();
		var menuHeight = window.innerHeight - parseInt($('#mainHeader').css('height')) - parseInt($('#textSliderWrap').css('height'));

		$container.css({
			overflow: 'hidden',
			position: 'relative',
			width: screen.width,
			height: menuHeight,
			marginTop: window.innerHeight - menuHeight
		});
		$target.css({
			width: $items.length * screen.width,
			position: 'absolute'
		});
		$items.css({
			float: 'left',
			width: screen.width,
			height: menuHeight,
			zIndex: '10',
			overflow: 'scroll'
		});

		var originalLeft = 0;
		var originalTop = 0;
		var oldLeft = 0;
		var oldTop = 0;
		var isScroll = false;

		$target.bind('touchstart', function(e) {
			var event = e.originalEvent;

			oldLeft = originalLeft = event.touches[0].clientX;
			oldTop = originalTop = event.touches[0].clientY;
		});
		$target.bind('touchmove', function(e) {
			var event = e.originalEvent;
			var distance = oldLeft - event.touches[0].clientX;
			oldLeft = event.touches[0].clientX;
			oldTop = event.touches[0].clientY;

			//스크롤중에는 메뉴목록 옆으로 옮기는것 방지하도록
			if(Math.abs(originalLeft - oldLeft) > screen.width / 8 && Math.abs(originalLeft - oldLeft) > Math.abs(originalTop - oldTop)) {
				isScroll = false;

				if((menuType != 0 || distance > 0) && (menuType != $items.length - 1 || distance < 0)) {
					$target.css('left', parseInt($target.css('left')) - distance);
				}
				e.preventDefault(); //스크롤 방지
			}
			else {
				isScroll = true;
			}
		});
		$target.bind('touchend', function(e) {
			if(!isScroll) {
				var event = e.originalEvent;

				function movePosition(direction) {
					var changePosition = menuType + direction;

					if (0 <= changePosition && changePosition < $items.length) {
					    menuType = changePosition;
					}
				}

				if (originalLeft - oldLeft > screen.width / 3) {
				    movePosition(+1);
				} else if (originalLeft - oldLeft < -screen.width / 3) {
				    movePosition(-1);
				}

				moveMenuPosition(menuType);
			}
		});
	};

	$('#textSlider').menuTitlePivot();
	$('#menuSlider').menuPivot();

	//메뉴페이지 이동함수
	function moveMenuPosition(direction) {
		$('#menuSlider').animate({
			left: -direction * screen.width
		}, 170);

		moveUnverBar(direction);

		oldDirection = direction;
	}
	//메뉴이름 언더바 이동함수
	function moveUnverBar(direction) {
		var leftPos = 0;

		//선택한 메뉴타이틀보다 앞에 있는 메뉴이름들의 width 다더해줌
		for(var i=0;i<direction;i++) {
			leftPos += parseInt($('.menuTitle[data-index=' + i + ']').css('width')) + 0.5;
		}

		$('#menuTitleUnderBar').css({
			width: parseInt($('.menuTitle[data-index=' + direction + ']').css('width')),
			left: leftPos
		});

		//메뉴제목 슬라이더 이동하기위한 코드
		if(direction != 0) {   //첫번째 메뉴목록이 아닐때
			if(oldDirection < direction) {    //메뉴슬라이더를 오른쪽으로 이동할 때
				if(leftPos < parseInt($('#textSlider').css('width')) - screen.width) {   //메뉴슬라이더가 아직 오른쪽끝에 닿지 않았을때
					$('#textSlider').css('left', -leftPos + parseInt($('.menuTitle').first().css('width')));
				}
				else {      //메뉴 슬라이더가 오른쪽 끝에 닿앗을경우
					$('#textSlider').css('left', -parseInt($('#textSlider').css('width')) + screen.width);
				}
			}
			else if(oldDirection > direction) {     //메뉴슬라이더를 왼쪽으로 이동할 때
				if(leftPos - parseInt($('.menuTitle').first().css('width')) < parseInt($('#textSlider').css('width')) - screen.width) {  //메뉴슬라이더 왼쪽으로 이동중인데 이때 슬라이더 이동이 필요할때, 다시말해 오른쪽끝에 붙었던 슬라이더가 다시 이동이 필요할때
					$('#textSlider').css('left', -leftPos + parseInt($('.menuTitle').first().css('width')));
				}
			}
		}
		else {    //첫번째 메뉴목록일 경우는 무조건 텍스트 슬라이더를 왼쪽에 맞춘다
			$('#textSlider').css('left', 0);
		}

		$('#headerTitle').html($('.menuTitle[data-index=' + direction + ']').html());
	}

	//식당목록에서 식당 클릭시 색변경
	function rstrtListHover() {
		var oldLeft = 0;
		var oldTop = 0;

		$('.restaurantList').on('touchstart', '.restaurant', function(e) {
			var event = e.originalEvent;
			oldLeft = event.touches[0].clientX;
			oldTop = event.touches[0].clientY;

			$(this).css('backgroundColor', 'rgb(250, 250, 250)');
		});
		$('.restaurantList').on('touchmove', '.restaurant', function(e) {
			var event = e.originalEvent;

			if(Math.abs(oldLeft - event.touches[0].clientX) > 50 || Math.abs(oldTop - event.touches[0].clientY) > 10)
			$(this).css('backgroundColor', 'white');
		});
		$('.restaurantList').on('touchend', '.restaurant', function(e) {
			$(this).css('backgroundColor', 'white');
		});
	};
	rstrtListHover();

	//처음 페이지 접속시 클릭한 메뉴목록 페이지로 이동
	moveMenuPosition(menuType);

	//서버로부터 식당목록 데이터 받아옴
	$.ajax({
		url: ip + '/getRestaurants',
		type: 'GET',
		dataType: "jsonp",
		success: function(data) {
			var tag = [['낙지볶음', '매운맛'], ['두루치기', '국내산'], ['낙지볶음', '매운맛'], ['두루치기', '국내산']];

			data.forEach(function(item, index) {
				var itemStr = '';

				itemStr += '<li class="restaurant">' +
								'<a href="restaurant.html?restNum=' + item.rid + '">' +
									'<img src="' + ip + '/' + item.rimg + '" class="rstrtImg" />' +
									'<div class="rstrtInfo">' +
										'<h2 class="rstrtName">' + item.rname + '</h2>' +
										'<h3 class="rstrtGrade">평점 4.2 / 리뷰 32</h3>' +
										'<h4 class="rstrtKeyword">#' + tag[index][0] + ' #' + tag[index][1] + '</h4>' +
									'</div>' +
									'<img src="image/arrow.png" class="rstrtArrow" />' +
								'</a>' +
							'</li>';

				$('.restaurantList[id=list' + item.rtype + ']').append($(itemStr));
			});
		},
		error: function(error) {
			alert(JSON.stringify(error));
		}
	});
});
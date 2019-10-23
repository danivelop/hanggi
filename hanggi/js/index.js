$(document).ready(function() {
	var mainAddress = {};
	var sectionHeight = window.innerHeight;
	var distance = 0.1;

	/*초기화*/
	$('#mainSection').css('height', window.innerHeight - parseInt($('#mainHeader').css('height')));
	$('#menu > ul > li').css('height', parseInt($('#menu > ul > li').css('width')));
	$('.navItem').css({
		height: $('.navItem').css('width'),
		lineHeight: $('.navItem').css('width')
	});

	//메인주소 존재여부
	if(window.localStorage.getItem("mainAddress")) {   //메인주소가 있을때(한번이상 어플 사용했을때)
		mainAddress = JSON.parse(window.localStorage.getItem("mainAddress"));

		$('#headerTitle > h1').html(mainAddress["areaAddress"]);
	}
	else {
		window.location.href = './searchAddress.html';
		return;
	}

	/*네비게이션 이벤트*/
	$('#mainNavBtn').click(function() {
		$('#mainNav').css({
			visibility: 'visible',
			backgroundColor: 'rgba(0, 0, 0, 0.7)'
		});
		$('#mainNavWrap').css('left', '0px');
	});
	$('#mainNav').click(function() {
		$(this).css({
			visibility: 'hidden',
			backgroundColor: 'rgba(0, 0, 0, 0.0)'
		});
		$('#mainNavWrap').css('left', '-80vw');
	});

	//매칭대기방 함수
	$.ajax({
		url: ip + '/getWaiting',
		type: 'GET',
		dataType: "jsonp",
		data: {
			mainAddress: JSON.stringify(mainAddress)
		},
		success: function(data) {
			var roomList = [];
			var checkedPersonList = [];    //이미 확인한 주문자
			var roomIndex = 0;    //각룸에 고유번호 붙임(같은식당을 대상으로 한 방이 여러개가 될수 있으므로 식당의 프라이머리키는 고유번호로 쓰지못함)

			for(var i=0;i<data.length;i++) {
				//방 제한시간 변수
				var limitTime = new Date(data[i].owdate);
				limitTime.setMinutes(limitTime.getMinutes() + data[i].owwaiting);

				var roomNumber = [];

				for(var j=0;j<data.length;j++) {
					if(i == j) {  //자기자신과 같은 객체는 검사불필요
						continue;
					}

					if(getDistance(data[i].owlatitude, data[i].owlongitude, data[j].owlatitude, data[j].owlongitude) < distance && data[i].rid == data[j].rid) {
						//B가 이전에 검사한 대기자일경우 새로운방 생성하지않고 기존 B가 있는방에 A를 넣음
						if(checkPerson(checkedPersonList, data[j].owid)) {
							var joinedRoom = checkPerson(checkedPersonList, data[j].owid);

							//기존방에 A를 넣으며 해당방의 주문금액을 A의 주문금액만큼 더하고 참여자에 A를 추가시킴
							for(var k=0;k<joinedRoom.length;k++) {
								if(roomList[joinedRoom[k]].participant.length == 1) {
									roomList[joinedRoom[k]].currentPrice += data[i].owtotalprice;  //A가 주문한 금액만큼 추가
									
									//새로 방에 들어온 주문자의 주문 만료시간이 더 빠를경우 방의 제한시간 바꿔줌
									if(roomList[joinedRoom[k]].roomLimitTime > limitTime.getTime()) {
										roomList[joinedRoom[k]].roomLimitTime = limitTime.getTime();
										roomList[joinedRoom[k]].limitTimeTarget = data[i].owid;
									}

									roomList[joinedRoom[k]].participant.push(data[i].owid);      //A를 방 참여자목록에 추가
									roomNumber.push(joinedRoom[k]);

									break;
								}
							}
						}
						//B가 아직 검사하지 않은 대기자일경우 새로운방 생성후 A를 넣음(추후에 이방에 B도 들어옴)
						else {
							var room = {
								roomNumber: roomIndex++,
								roomKey: data[i].rid,
								roomName: data[i].owrname,
								minPrice: data[i].owminprice,
								currentPrice: data[i].owtotalprice,
								roomLimitTime: limitTime.getTime(),
								participant: [data[i].owid],
								limitTimeTarget: data[i].owid   //현재방에서 제한시간이 짦은 주문자(제한시간 지났을때 해당 주문자 방에서 빼기위해)
							};

							roomNumber.push(room.roomNumber);
							roomList.push(room);
						}
					}
				}

				//waiting목록에 한명만 있었거나 주변 대기자중 한사람이 다른 대기자들과 거리가 멀어 혼자있는 방을 생성해야 할때
				if(roomNumber.length == 0) {
					var room = {
						roomNumber: roomIndex++,
						roomKey: data[i].rid,
						roomName: data[i].owrname,
						minPrice: data[i].owminprice,
						currentPrice: data[i].owtotalprice,
						roomLimitTime: limitTime.getTime(),
						participant: [data[i].owid],
						limitTimeTarget: data[i].owid     //현재방에서 제한시간이 짦은 주문자(제한시간 지났을때 해당 주문자 방에서 빼기위해)
					};

					roomNumber.push(room.roomNumber);
					roomList.push(room);
				}

				//A를 확인한 대기자목록에 추가
				var checkedPerson = {
					personIndex: data[i].owid,
					joinedRoom: roomNumber
				};

				checkedPersonList.push(checkedPerson);
			}

			//방목록에 파싱
			roomList.forEach(function(item, index) {
				var itemStr = '';

				itemStr += '<a href="restaurant.html?restNum=' + item.roomKey + '">' +
								'<img src="image/lotteria.jpg" class="rstrtImg" />' +
								'<div class="rstrtInfo">' +
									'<h2 class="rstrtName">' + item.roomName + '</h2>' +
									'<h3 class="remainPrice">남은금액 ' + (item.minPrice - item.currentPrice) + '원</h4>' +
									'<h3 class="remainTime">남은시간 ' + convertToMinSec(item.roomLimitTime - new Date().getTime()) + '</h4>' +
								'</div>' +
							'</a>';

				$('<li></li>').addClass('matchingRoom').attr('room-index', item.roomNumber).html(itemStr).appendTo('#matchingList');
			});

			//방 제한시간 1초마다 체크
			setInterval(function() {
				for(var i=0;i<roomList.length;i++) {
					//방의 제한시간이 다되었을때
					if(roomList[i].roomLimitTime < new Date().getTime()) {
						//기존방에 한명밖에 없었으면 방 삭제
						if(roomList[i].participant.length == 1) {
							$('.matchingRoom[room-index=' + roomList[i].roomNumber + ']').remove();
							roomList.splice(i, 1);
						}
						//두명있었으면 제한시간이 지난 한명을 방에서 뺌
						else if(roomList[i].participant.length == 2) {
							var target = roomList[i].limitTimeTarget;

							if(roomList[i].participant[0] == target) {
								roomList[i].limitTimeTarget = roomList[i].participant[1];
								roomList[i].participant.splice(0, 1);
							}
							else {
								roomList[i].limitTimeTarget = roomList[i].participant[0];
								roomList[i].participant.splice(1, 1);
							}

							for(var j=0;j<data.length;j++) {
								if(data[j].owid == roomList[i].limitTimeTarget) {
									roomList[i].currentPrice = data[j].owtotalprice;

									var limitTime = new Date(data[j].owdate);
									limitTime.setMinutes(limitTime.getMinutes() + data[j].owwaiting);

									roomList[i].roomLimitTime = limitTime;

									$('.matchingRoom[room-index=' + roomList[i].roomNumber + ']').find('.remainPrice').html('남은금액 ' + (roomList[i].minPrice - roomList[i].currentPrice) + '원');
									$('.matchingRoom[room-index=' + roomList[i].roomNumber + ']').find('.remainTime').html('남은시간 ' + convertToMinSec(roomList[i].roomLimitTime - new Date().getTime()));

									break;
								}
							}
						}
					}

					$('.matchingRoom[room-index=' + roomList[i].roomNumber + ']').find('.remainTime').html('남은시간 ' + convertToMinSec(roomList[i].roomLimitTime - new Date().getTime()));
				}
			}, 1000);
		},
		error: function(error) {
			alert(JSON.stringify(error));
		}
	});

	function getDistance(lat1, lon1, lat2, lon2) {
	    var p = 0.017453292519943295;    // Math.PI / 180
	    var a = 0.5 - Math.cos((lat2 - lat1) * p)/2 + Math.cos(lat1 * p) * Math.cos(lat2 * p) * (1 - Math.cos((lon2 - lon1) * p))/2;

	    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
	}
	function checkPerson(checkedPersonList, personIndex) {
		for(var i=0;i<checkedPersonList.length;i++) {
			if(checkedPersonList[i].personIndex == personIndex) {
				return checkedPersonList[i].joinedRoom;
			}
		}

		return false;
	}
	function convertToMinSec(milliSeconds) {
		var seconds = milliSeconds / 1000;
		var min = parseInt((seconds % 3600) / 60);
		var sec = parseInt(seconds % 60);

		if(min < 10) {
			min = '0' + min;
		}
		if(sec < 10) {
			sec = '0' + sec;
		}

		return min + ":" + sec;
	}
});
// $(document).ready(function() {
// 	/*초기화*/
// 	$('#mainSection').css('height', window.innerHeight - parseInt($('#mainHeader').css('height')));
// 	$('#menu > ul > li').css('height', parseInt($('#menu > ul > li').css('width')));

// 	//메인주소 존재여부
// 	if(window.localStorage.getItem("mainAddress")) {   //메인주소가 있을때(한번이상 어플 사용했을때)
// 		var mainAddress = window.localStorage.getItem("mainAddress");
// 		var addressItem = mainAddress.split(',');

// 		//세션에 메인주소정보 저장
// 		window.sessionStorage.setItem("areaAddress", addressItem[0]);
// 		window.sessionStorage.setItem("roadAddress", addressItem[1]);
// 		window.sessionStorage.setItem("latitude", addressItem[2]);
// 		window.sessionStorage.setItem("longitude", addressItem[3]);
// 		window.sessionStorage.setItem("region", addressItem[4]);
// 		window.sessionStorage.setItem("detailAddr", addressItem[5]);

// 		$('#headerTitle > h1').html(addressItem[0]);
// 	}
// 	else {          //메인주소가 없을때(어플 처음사용하거나 주소 재입력할때)
// 		if(!window.localStorage.getItem("isNotFirst")) {
// 			window.location.href = './searchAddress.html';
// 		}

// 		var getParameter = {};
// 		var latestAddress = '';
// 		var nowLocation = decodeURI(window.location.href);
// 		var parameters = (nowLocation.slice(nowLocation.indexOf('?') + 1, nowLocation.length)).split('&');

// 		for(var i=0;i<parameters.length;i++) {
// 		    var key = parameters[i].split('=')[0];
// 		    var value = parameters[i].split('=')[1];

// 		    getParameter[key] = value;
// 		}

// 		for(var key in getParameter) {
// 			if(key == 'areaAddress') {
// 				$('#headerTitle > h1').html(getParameter[key]);
// 				latestAddress += getParameter[key];
// 				window.sessionStorage.setItem("areaAddress", getParameter[key]);
// 			}
// 			if(key == 'roadAddress') {
// 				latestAddress += ',' + getParameter[key];
// 				window.sessionStorage.setItem("roadAddress", getParameter[key]);
// 			}
// 			if(key == 'latitude') {
// 				latestAddress += ',' + getParameter[key];
// 				window.sessionStorage.setItem("latitude", getParameter[key]);
// 			}
// 			if(key == 'longitude') {
// 				latestAddress += ',' + getParameter[key];
// 				window.sessionStorage.setItem("longitude", getParameter[key]);
// 			}
// 			if(key == 'region') {
// 				latestAddress += ',' + getParameter[key];
// 				window.sessionStorage.setItem("region", getParameter[key]);
// 			}
// 			if(key == 'detailAddr') {
// 				latestAddress += ',' + getParameter[key];
// 				window.sessionStorage.setItem("detailAddr", getParameter[key]);
// 			}
// 		}

// 		if(window.localStorage.getItem("recentAddress")) {  //저장된 최근주소가 있다면 이미있는 최근주소중 현재 입력한 주소가 중복인지 검사
// 			var recentAddress = window.localStorage.getItem("recentAddress");
// 			var addressArray = recentAddress.split('/');
// 			var isAddressExist = false;

// 			for(var i=0;i<addressArray.length;i++) {
// 				if(addressArray[i] == latestAddress) {
// 					isAddressExist = true;
// 				}
// 			}

// 			if(!isAddressExist) {
// 				window.localStorage.setItem("recentAddress", latestAddress + '/' + recentAddress);
// 			}
// 		}
// 		else {    //저장된 최근주소가 없다면 바로 현재 입력한 주소를 저장
// 			window.localStorage.setItem("recentAddress", latestAddress);
// 		}
// 		//메인주소로 현재 입력한 주소 저장
// 		window.localStorage.setItem("mainAddress", latestAddress);
// 	}
// });
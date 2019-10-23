$(document).ready(function() {
	var distance = 0.1;

	if(window.localStorage.getItem("mainAddress")) {
		mainAddress = JSON.parse(window.localStorage.getItem("mainAddress"));
	}

	/*현재 내주변에서 distance거리 이내의 대기자들 얻어온 후, 이들을 각각
	반복문으로 접근하는데 현재 접근한 사람이 A라할때, 최종적으로 이 A가 속할
	방의 갯수는 이 A라는 사람의 distance거리 이내에 같은 식당에서 주문한 
	사람들의 수이다. 따라서, 이중반목문을 써 첫번째 반복문에서 A에게 접근했으면
	두번째 반복문에서는 이 A라는 사람의 distance거리 이내의 주문자들을 접근한후
	그 수대로 방을 생성하지만 여기서 두번째 반복문에서 접근한 사람을 B라 할때
	이사람은 이전에 첫번째 반복문에서 접근하여 검사했던 사람이면 이미 B가 들이가
	있는 방이 있다는 말이니까 새로운 방을 생성할 필요없이 A를 이미 생성되어 있는
	B가 있는 방에 집어 넣으면 된다.*/
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
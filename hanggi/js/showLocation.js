$(document).ready(function() {
	var latitude = 0;
	var longitude = 0;
	var parametersURI = '';
	var getParameter = {};
	var mainAddress = {};

	//URI주소에서 get파라미터 정보 읽기
	var nowLocation = decodeURI(window.location.href);
	var parameters = (nowLocation.slice(nowLocation.indexOf('?') + 1, nowLocation.length)).split('&');

	//uri에서 얻은 get파라미터를 객체로 변환
	for(var i=0;i<parameters.length;i++) {
	    var key = parameters[i].split('=')[0];
	    var value = parameters[i].split('=')[1];

	    getParameter[key] = value;
	}

	for(var key in getParameter) {
		if(key == 'areaAddress') {
			getParameter[key] != '' ? $('.areaAddress').html(getParameter[key]) : '';
			mainAddress["areaAddress"] = getParameter[key];
			// parametersURI += 'areaAddress=' + getParameter[key];
		}
		if(key == 'roadAddress') {
			getParameter[key] != '' ? $('.roadAddress').html('[도로명]' + getParameter[key]) : '';
			mainAddress["roadAddress"] = getParameter[key];
			// parametersURI += '&roadAddress=' + getParameter[key];
		}
		if(key == 'latitude') {
			latitude = getParameter[key];
			mainAddress["latitude"] = parseFloat(getParameter[key]);
			// parametersURI += '&latitude=' + getParameter[key];
		}
		if(key == 'longitude') {
			longitude = getParameter[key];
			mainAddress["longitude"] = parseFloat(getParameter[key]);
			// parametersURI += '&longitude=' + getParameter[key];
		}
		if(key == 'region') {
			mainAddress["region"] = getParameter[key];
			// parametersURI += '&region=' + getParameter[key];
		}
		if(key == 'detailAddr') {
			$('#detailAddr').val(getParameter[key]);
		}
	}

	//배달버튼 클릭
	$('#decideAddr').click(function() {
		mainAddress["detailAddr"] = $('#detailAddr').val();

		window.localStorage.setItem("mainAddress", JSON.stringify(mainAddress));
		checkRecentAddress();

		//디바이스 정보 저장
		FCMPlugin.getToken(function(token) {    //푸시메시지를 위해 기기의 번호 얻음
			$.ajax({
				url: ip + '/getDeviceInfo',
				type: 'GET',
				dataType: "jsonp",
				data: {
					latitude: mainAddress["latitude"],
					longitude: mainAddress["longitude"],
					deviceID: token
				},
				success: function(data) {
					// window.location.href = './index.html';
					history.go(-2);
				},
				error: function(error) {
					alert(JSON.stringify(error));
				}
			});
		});
		// window.localStorage.removeItem("mainAddress");
		// window.localStorage.setItem("isNotFirst", true);

		// parametersURI += '&detailAddr=' + $('#detailAddr').val();
		// var uri = encodeURI(parametersURI);
		// window.location.href = './index.html?' + uri;
	});

	//현재 입력한 주소가 현재주소 로컬스토리지에 있는지 체크후 없으면 저장
	function checkRecentAddress() {
		var latestAddress = mainAddress["areaAddress"] + ',' + mainAddress["roadAddress"] + ',' + mainAddress["latitude"] + ',' + mainAddress["longitude"] + ',' + mainAddress["region"] + ',' + mainAddress["detailAddr"];

		if(window.localStorage.getItem("recentAddress")) {  //저장된 최근주소가 있다면 이미있는 최근주소중 현재 입력한 주소가 중복인지 검사
			var recentAddress = window.localStorage.getItem("recentAddress");
			var addressArray = recentAddress.split('/');
			var isAddressExist = false;

			for(var i=0;i<addressArray.length;i++) {
				if(addressArray[i] == latestAddress) {
					isAddressExist = true;
				}
			}

			if(!isAddressExist) {
				window.localStorage.setItem("recentAddress", latestAddress + '/' + recentAddress);
			}
		}
		else {    //저장된 최근주소가 없다면 바로 현재 입력한 주소를 저장
			window.localStorage.setItem("recentAddress", latestAddress);
		}
	}

	//지도업로드 코드
	$('.map_style').css('height', window.innerHeight - parseInt($('#mainHeader').css('height')) - parseInt($('#addrInfo').css('height')) - parseInt($('#addrInfo').css('paddingTop')) - parseInt($('#decideAddr').css('height')) + 'px');

	//지도생성
	var map = new naver.maps.Map("map", {
	    center: new naver.maps.LatLng(latitude, longitude),
	    zoom: 16,
	    mapTypeControl: true
	});

    //마커이미지 중심으로 초기화
    $('#marker').css('left', parseInt($('#marker').css('left')) - parseInt($('#marker').css('width')) / 2);
    $('#marker').css('top', parseInt($('#marker').css('top')) - parseInt($('#marker').css('height')));

    // 지도를 움직였을 때 움직인 위치 좌표로 주소수정
    naver.maps.Event.addListener(map, 'bounds_changed', function(bounds) {
    	var tm128 = naver.maps.TransCoord.fromLatLngToTM128(map.getCenter());

    	naver.maps.Service.reverseGeocode({
    	    location: tm128,
    	    coordType: naver.maps.Service.CoordType.TM128
    	}, function(status, response) {
    	    if (status === naver.maps.Service.Status.ERROR) {
    	         return alert('선택하신 위치에 대한 정보가 없습니다.');
    	    }

    	    var admAddr = '';
    	    var roadAddr = '';
    	    var latitude = map.getCenter().y;
    	    var longitude = map.getCenter().x;
    	    var region = '';

    	    //검색결과에서 배열돌며 해당인덱스가 지번주소인지 도로명주소인지에 따라 변수에 값 대입
    	    for(var i=0;i<response['result']['items'].length;i++) {
    	    	if(response['result']['items'][i]['isAdmAddress']) {
    	    		admAddr = response['result']['items'][i]['address'];
    	    	}
    	    	else if(response['result']['items'][i]['isRoadAddress']) {
    	    		roadAddr = response['result']['items'][i]['address'];
    	    	}
    	    	else {
    	    		region = response['result']['items'][i]['addrdetail']['dongmyun'];
    	    	}
    	    } 

	    	mainAddress["areaAddress"] = admAddr;
	    	mainAddress["roadAddress"] = roadAddr;
	    	mainAddress["latitude"] = parseFloat(latitude);
	    	mainAddress["longitude"] = parseFloat(longitude);
	    	mainAddress["region"] = region;

	    	$('.areaAddress').html(admAddr);
	    	if(roadAddr != '') {
	    		$('.roadAddress').html('[도로명]' + roadAddr);
	    	}
	    	else {
	    		$('.roadAddress').empty();
	    	}

	    	// alert(getDistance(oldAddress["latitude"], oldAddress["longitude"], mainAddress["latitude"], mainAddress["longitude"]));
    	});
    });

    // var oldAddress = {};

    // if(window.localStorage.getItem("mainAddress")) {
	// 	oldAddress = JSON.parse(window.localStorage.getItem("mainAddress"));
	// }

    function getDistance(lat1, lon1, lat2, lon2) {
        var p = 0.017453292519943295;    // Math.PI / 180
        var a = 0.5 - Math.cos((lat2 - lat1) * p)/2 + Math.cos(lat1 * p) * Math.cos(lat2 * p) * (1 - Math.cos((lon2 - lon1) * p))/2;

        return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    }

    // 지도를 클릭했을 때 클릭 위치 좌표로 주소수정
    // daum.maps.event.addListener(map, 'idle', function() {
    //     searchDetailAddrFromCoords(map.getCenter(), function(result, status) {
    //         if (status === daum.maps.services.Status.OK) {
    //             try {
	   //              var addr = '';

	   //              if(result[0]["road_address"]) {
	   //              	addr = result[0]["road_address"]["address_name"];
	   //              }
	   //              else if(result[0]["address"]) {
	   //              	addr = result[0]["address"]["address_name"];
	   //              }
	   //              else {
	   //              	throw 'NotFoundLocation';
	   //              }

	   //              geocoder.addressSearch(addr, function(result, status) {
	   //              	mainAddress["areaAddress"] = result[0]["address"] ? result[0]["address"]["address_name"] : '';
	   //              	mainAddress["roadAddress"] = result[0]["road_address"] ? result[0]["road_address"]["address_name"] : '';
	   //              	mainAddress["latitude"] = result[0]['y'];
	   //              	mainAddress["longitude"] = result[0]['x'];
	   //              	mainAddress["region"] = result[0]['road_address'] ? result[0]['road_address']['region_3depth_name'] : '';

	   //              	$('.areaAddress').html(mainAddress["areaAddress"]);
	   //              	if(mainAddress["roadAddress"] != '') {
	   //              		$('.roadAddress').html('[도로명]' + mainAddress["roadAddress"]);
	   //              	}
	   //              	else {
	   //              		$('.roadAddress').empty();
	   //              	}
	   //              });
    //         	} catch(exception) {
    //         		alert('선택하신 위치에 대한 정보가 없습니다.')
    //         	}
    //         }   
    //     });
    // });

    // function searchDetailAddrFromCoords(coords, callback) {
    //     // 좌표로 법정동 상세 주소 정보를 요청
    //     geocoder.coord2Address(coords.getLng(), coords.getLat(), callback);
    // }
});
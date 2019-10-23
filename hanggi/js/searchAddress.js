$(document).ready(function() {
	//초기화
	$('#bg').css({
		height: window.innerHeight,
		top: $('#mainHeader').css('height')
	});
	$('#searchAdd').on({
		focus: function() {
			$('#bg').css('display', 'block');
		},
		blur: function() {
			$('#bg').css('display', 'none');
		}
	});

	//주소검색창에 주소입력후 엔터 누를시
	$(document).keypress(function(key) {
		if(key.keyCode == 13) {
			//검색시 주소입력창의 초점을 없앰
			$('#searchAdd').blur();

			//기존 검색되었던 주소목록을 없앰
			$('#resultAdd').empty();
			
			$('#recentAdd').css('display', 'none');
			$('#searchResult').css('display', 'block').find('.conTitle').html('주소 검색 결과 ' + '"' + $('#searchAdd').val() + '"');

			// $.ajax({
			// 	url: ip + '/searchArea',
			// 	type: 'GET',
			// 	dataType: "jsonp",
			// 	data: {
			// 		query: $('#searchAdd').val()
			// 	},
			// 	success: function(data) {
			// 		var areaResult = data.items;

			// 		if(areaResult.length == 0) {
			// 			return noResult();
			// 		}

			// 		for(var i=0;i<areaResult.length;i++) {
			// 			var itemStr = '';
			// 			var admAddr = false;
			// 			var roadAddr = false;

			// 			//검색결과에서 배열돌며 해당인덱스가 지번주소인지 도로명주소인지에 따라 변수에 값 대입
			// 			if(areaResult[i]['address']) {
			// 				admAddr = areaResult[i]['address'];
			// 			}
			// 			if(areaResult[i]['roadAddress']) {
			// 				roadAddr = areaResult[i]['roadAddress'];
			// 			}

			// 			itemStr += '<img src="image/addrLocation.png" class="addrLocImg" />' +
			// 						'<h3 class="addressName">' + admAddr + '</h3>' +
			// 						'<h4 class="areaAddress">' + (admAddr ? '[지번]' + admAddr : '') + '</h4>' +
			// 						'<h4 class="roadAddress">' + (roadAddr ? '[도로명]' + roadAddr : '') + '</h4>';

			// 			$('<li></li>').addClass('searchAddress').html(itemStr).attr({
			// 				'data-areaAddr': admAddr ? admAddr : '',
			// 				'data-roadAddr': roadAddr ? roadAddr : '',
			// 				'data-y': areaResult[i]['mapy'],
			// 				'data-x': areaResult[i]['mapx']
			// 			}).appendTo($('#resultAdd'));
			// 		}
			// 	},
			// 	error: function(error) {
			// 		alert(JSON.stringify(error));
			// 	}
			// });

			naver.maps.Service.geocode({
				address: $('#searchAdd').val()
			}, function(status, responseSearch) {
			    if (status === naver.maps.Service.Status.ERROR) {
			        return noResult();
			    }

			    var item = responseSearch.result.items[0];
			    var point = new naver.maps.Point(item.point.x, item.point.y);
			    var tm128 = naver.maps.TransCoord.fromLatLngToTM128(point);

			    naver.maps.Service.reverseGeocode({
			        location: tm128,
			        coordType: naver.maps.Service.CoordType.TM128
			    }, function(status, responseCoord) {
			        if (status === naver.maps.Service.Status.ERROR) {
			            return noResult();
			        }

			        var itemStr = '';
			        var admAddr = false;
			        var roadAddr = false;
			        var region = false;

			        //검색결과에서 배열돌며 해당인덱스가 지번주소인지 도로명주소인지에 따라 변수에 값 대입
			        for(var i=0;i<responseCoord['result']['items'].length;i++) {
			        	if(responseCoord['result']['items'][i]['isAdmAddress']) {
			        		admAddr = responseCoord['result']['items'][i]['address'];
			        	}
			        	else if(responseCoord['result']['items'][i]['isRoadAddress']) {
			        		roadAddr = responseCoord['result']['items'][i]['address'];
			        	}
			        	else {
			        		region = responseCoord['result']['items'][i]['addrdetail']['dongmyun'];
			        	}
			        } 

			        itemStr += '<img src="image/addrLocation.png" class="addrLocImg" />' +
			        			'<h3 class="addressName">' + responseSearch['result']['items'][0]['address'] + '</h3>' +
			        			'<h4 class="areaAddress">' + (admAddr ? '[지번]' + admAddr : '') + '</h4>' +
			        			'<h4 class="roadAddress">' + (roadAddr ? '[도로명]' + roadAddr : '') + '</h4>';

			        $('<li></li>').addClass('searchAddress').html(itemStr).attr({
			        	'data-areaAddr': admAddr ? admAddr : '',
			        	'data-roadAddr': roadAddr ? roadAddr : '',
			        	'data-y': item.point.y,
			        	'data-x': item.point.x,
			        	'data-region': region ? region : ''
			        }).appendTo($('#resultAdd'));
			    });
			});

			// geocoder.addressSearch($('#searchAdd').val(), function(result, status) {
			// 	if(result) {
			// 		for(var i=0;i<result.length;i++) {
			// 			var itemStr = '';

			// 			itemStr += '<img src="image/addrLocation.png" class="addrLocImg" />' +
			// 						'<h3 class="addressName">' + (result[i]['address_name'] ? result[i]['address_name'] : '') + '</h3>' +
			// 						'<h4 class="areaAddress">' + (result[i]['address'] ? '[지번]' + result[i]['address']['address_name'] : '') + '</h4>' +
			// 						'<h4 class="roadAddress">' + (result[i]['road_address'] ? '[도로명]' + result[i]['road_address']['address_name'] : '') + '</h4>';

			// 			$('<li></li>').addClass('searchAddress').html(itemStr).attr({
			// 				'data-areaAddr': result[i]['address'] ? result[i]['address']['address_name'] : '',
			// 				'data-roadAddr': result[i]['road_address'] ? result[i]['road_address']['address_name'] : '',
			// 				'data-y': result[i]['y'],
			// 				'data-x': result[i]['x'],
			// 				'data-region': result[i]['road_address'] ? result[i]['road_address']['region_3depth_name'] : ''
			// 			}).appendTo($('#resultAdd'));
			// 		}
			// 	}
			// 	else {
			// 		noResult();
			// 	}
			// });
		}
	});

	//검색 결과가 없거나 조회된 모든 주소정보에서 지번주소값이 null일 경우
	function noResult() {
		$('<p></p>').addClass('noResult').html('검색 결과가 없습니다').appendTo($('#resultAdd'));
	}

	//GPS로 위치찾는 경우
	$('#findCurLoc').click(function() {
		if(navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position, status) {
				var tm128 = naver.maps.TransCoord.fromLatLngToTM128(new naver.maps.LatLng(position.coords.latitude, position.coords.longitude));

		    	naver.maps.Service.reverseGeocode({
		    	    location: tm128,
		    	    coordType: naver.maps.Service.CoordType.TM128
		    	}, function(status, response) {
		    		var areaAddr;
		    		var roadAddr;
		    		var region;

		    		for(var i=0;i<response['result']['items'].length;i++) {
		    			if(response['result']['items'][i]['isAdmAddress']) {
		    				areaAddr = response['result']['items'][i]['address'];
		    			}
		    			else if(response['result']['items'][i]['isRoadAddress']) {
		    				roadAddr = response['result']['items'][i]['address'];
		    			}
		    			else {
		    				region = response['result']['items'][i]['addrdetail']['dongmyun'];
		    			}
		    		}

		    		getLocation(areaAddr, roadAddr, position.coords.latitude, position.coords.longitude, region);
		    	});
				// if(status === 'OK') {
				// 	alert('3');
				// 	var locY = position.coords.latitude;
				// 	var locX = position.coords.longitude;

				// 	$.ajax({
				// 		url: 'https://dapi.kakao.com/v2/local/geo/coord2address.json',
				// 		type: 'GET',
				// 		dataType: 'json',
				// 		headers: {
				// 			Authorization: '카카오 api key'
				// 		},
				// 		data: {
				// 			x: locX,
				// 			y: locY
				// 		},
				// 		success: function(data) {
				// 			alert('4');
				// 			var areaAddr = data.documents[0]['address']['address_name'];
				// 			var roadAddr = data.documents[0]['road_address']['address_name'];
				// 			var region = data.documents[i]['address']['region_3depth_name'];

				// 			if(data.documents[0]['road_address'] && data.documents[0]['address']) {
				// 				getLocation(areaAddr, roadAddr, locY, locX, region);
				// 			}
				// 			else {
				// 				noResult();
				// 			}
				// 		},
				// 		error: function(error) {
				// 			alert(error);
				// 		}
				// 	});
				// }
			}, function(e) {
				alert(e.message);
			});
		}
		else {
			alert('해당 스마트폰의 브라우저가 GeoLocation기능을 지원하지 않습니다');
		}
	});

	//검색된 주소목록에서 주소 선택하는 경우
	$('#resultAdd').on('click', '.searchAddress', function(event) {
		// var tm128 = new naver.maps.Point(parseInt($(this).attr('data-x')), parseInt($(this).attr('data-y')));

		// naver.maps.Service.reverseGeocode({
		//     location: tm128,
		//     coordType: naver.maps.Service.CoordType.TM128
		// }, function(status, responseCoord) {
		//     if (status === naver.maps.Service.Status.ERROR) {
		//         return noResult();
		//     }

		//     alert(JSON.stringify(responseCoord));
		//     alert(responseCoord['result']['items'].length);
		// });

		var areaAddr = $(this).attr('data-areaaddr');
		var roadAddr = $(this).attr('data-roadaddr');
		var locY = $(this).attr('data-y');
		var locX = $(this).attr('data-x');
		var region = $(this).attr('data-region');

		getLocation(areaAddr, roadAddr, locY, locX, region);
	});

	//GPS 또는 검색된 주소목록에서 주소 선택시 해당주소의 위치 지도에 표시하는 함수
	function getLocation(areaAddr, roadAddr, latitude, longitude, region) {
		var parameters = 'areaAddress=' + areaAddr + '&roadAddress=' + roadAddr + '&latitude=' + latitude + '&longitude=' + longitude + '&region=' + region;
		var uri = encodeURI(parameters);
		window.location.href = './showLocation.html?' + uri;
	}

	//최근주소에서 주소 선택하는 경우
	$('#latestAdd').on('click', '.recentAddress', function(event) {
		var parameters = 'areaAddress=' + $(this).attr('data-areaAddr') + '&roadAddress=' + $(this).attr('data-roadAddr') + '&latitude=' + $(this).attr('data-y') + '&longitude=' + $(this).attr('data-x') + '&region=' + $(this).attr('data-region') + '&detailAddr=' + $(this).attr('data-detailAddr');
		var uri = encodeURI(parameters);
		window.location.href = './showLocation.html?' + uri;
	});

	//최근주소 파싱
	if(window.localStorage.getItem("recentAddress")) {
		var recentAddress = window.localStorage.getItem("recentAddress");
		var addressArray = recentAddress.split('/');

		for(var i=0;i<addressArray.length;i++) {
			var addressItem = addressArray[i].split(',');

			var areaAddress = addressItem[0];
			var roadAddress = addressItem[1];
			var latitude = addressItem[2];
			var longitude = addressItem[3];
			var region = addressItem[4];
			var detailAddr = addressItem[5];

			var itemStr = '<img src="image/addrLocation.png" class="addrLocImg" />' +
							'<h3 class="addressName">' + areaAddress + ', ' + detailAddr + '</h3>' +
							'<h4 class="roadAddress">[도로명]' + roadAddress +'</h4>' +
							'<img src="image/cancle.png" class="removeAddressImg" />';

			$('<li></li>').addClass('recentAddress').attr({
				'data-areaAddr': areaAddress,
				'data-roadAddr': roadAddress,
				'data-y': latitude,
				'data-x': longitude,
				'data-region': region,
				'data-detailAddr': detailAddr
			}).html(itemStr).appendTo($('#latestAdd'));
		}

		//최근주소 삭제이벤트
		$('#latestAdd').on('click', '.removeAddressImg', function(e) {
			var addressStr = $(this).parent().attr('data-areaAddr') + ',' + $(this).parent().attr('data-roadAddr') + ',' + $(this).parent().attr('data-y') + ',' + $(this).parent().attr('data-x') + ',' + $(this).parent().attr('data-region') + ',' + $(this).parent().attr('data-detailAddr');
			var targetIndex = 0;
			recentAddress = '';

			for(var i=0;i<addressArray.length;i++) {
				if(addressArray[i] == addressStr) {
					addressArray.splice(i, 1);
					break;
				}
			}

			for(var i=0;i<addressArray.length;i++) {
				if(i >= (addressArray.length - 1)) {
					recentAddress += addressArray[i];
				}
				else {
					recentAddress += addressArray[i] + '/';
				}
			}

			window.localStorage.setItem("recentAddress", recentAddress);
			$(this).parent().remove();

			e.stopPropagation();
			e.preventDefault();
		});
	}

	// $('#searchAdd').val('영운로 90-5');
	// $(document).trigger($.Event("keypress", {keyCode: 13}));
});
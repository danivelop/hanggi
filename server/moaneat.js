var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var FCM = require('fcm-node');
var requestLocal = require('request');   //네이버API에서 키워드로 지역검색시 필요

var client = mysql.createConnection({
    user: 'root',
    password: 'qwer1234',
    database: 'moaneat'
});

//푸시메세지
var serverKey = '서버 key';
var fcm = new FCM(serverKey);
var push_data = {
    to: "",
    notification: {
        title: "주문매칭",
        body: "주문이 매칭되었습니다",
        sound: "default",
        click_action: "FCM_PLUGIN_ACTIVITY",
        icon: "marker.png"
    },
    priority: "high",
    restricted_package_name: "com.cordova.moaneat",
    data: {
    }
};

var app = express();
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static('images'));

var distance = 0.1;
var distanceOfLat = 0.0009 * (distance / 0.1);   //떨어져있는 거리가 (distance)m일때 위도의 차이
var distanceOfLon = 0.001121 * (distance / 0.1);   //떨어져있는 거리가 (distance)m일때 경도의 차이

app.get('/searchArea', function(request, response) {
    var localKeyword = request.query.query;
    var callback = request.query.callback;

    var options = {
        url: 'https://openapi.naver.com/v1/search/local.json?query=' + encodeURI(localKeyword) + '&display=15&start=1&sort=random',
        headers: {
            'X-Naver-Client-Id':"클라이언트 ID",
            'X-Naver-Client-Secret': "secret ID"
        }
    };

    requestLocal.get(options, function(error, res, body) {
        if(!error && res.statusCode == 200) {
            response.send(callback + '(' + body + ')');
        }
        else {
            response.status(res.statusCode).send(callback + '(' + '{"error": "error"}' + ')');
        }
    });
    // $.ajax({
    //     url: 'https://openapi.naver.com/v1/search/local.xml?query=%EC%A3%BC%EC%8B%9D&display=10&start=1&sort=random',
    //     contentType: "text/javascript; charset=UTF-8",
    //     type: 'GET',
    //     dataType: "jsonp",
    //     crossDomain: true,
    //     headers: {
    //         "X-Naver-Client-Id": "클라이언트 ID",
    //         "X-Naver-Client-Secret": "secret ID"
    //     },
    //     success: function(data) {
    //         console.log(JSON.stringify(data));
    //         response.send('success');
    //     },
    //     error: function(error) {
    //         alert(JSON.stringify(error));
    //     }
    // });

    // var api_url = 'https://openapi.naver.com/v1/search/local.xml?query=%EC%A3%BC%EC%8B%9D&display=10&start=1&sort=random' // json 결과
    // //   var api_url = 'https://openapi.naver.com/v1/search/blog.xml?query=' + encodeURI(req.query.query); // xml 결과
    //    var options = {
    //        url: api_url,
    //        headers: {'X-Naver-Client-Id':"클라이언트 ID", 'X-Naver-Client-Secret': "secret ID"}
    //     };
    //    request.get(options, function (error, response, body) {
    //      if (!error && response.statusCode == 200) {
    //         console.log(JSON.stringify(body));
    //        res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
    //        res.end(body);
    //      } else {
    //        res.status(response.statusCode).end();
    //        console.log('error = ' + response.statusCode);
    //      }
    //    });
});
app.get('/getDeviceInfo', function (request, response) {
    var latitude = request.query.latitude;
    var longitude = request.query.longitude;
    var deviceID = request.query.deviceID;
    var callback = request.query.callback;

    client.query('select * from deviceinfo where deviceid = ?', [deviceID], function(error, data) {
        if(error) {
            console.log(error);
            throw error;
        }

        if(data.length == 0) {
            client.query('insert into deviceinfo (dlatitude, dlongitude, deviceid) values (?, ?, ?)', [latitude, longitude, deviceID], function(error, data) {
                if(error) {
                    console.log(error);
                    throw error;
                }
            });
        }
        else {
            if(data[0].dlatitude != latitude || data[0].dlongitude != longitude) {
                client.query('update deviceinfo set dlatitude = ?, dlongitude = ? where deviceid = ?', [latitude, longitude, deviceID], function(error, data) {
                    if(error) {
                        console.log(error);
                        throw error;
                    }
                });
            }
        }

        response.send(callback + '(' + '{"success": "success"}' + ')');
    });
});

app.get('/getWaiting', function (request, response) {
    var mainAddress = JSON.parse(request.query.mainAddress);
    var callback = request.query.callback;
    var waitingArr = [];     //주변 사각형 범위안의 대기자 뽑아낸뒤 반경 100m이내 대기자 골라서 이배열에 넣음

    // client.query('select * from orderwaiting where owlatitude > ? and owlatitude < ? and owlongitude > ? and owlongitude < ? and timestampdiff(second, owdate, now()) < owwaiting * 60', [mainAddress["latitude"] - distanceOfLat, mainAddress["latitude"] + distanceOfLat, mainAddress["longitude"] - distanceOfLon, mainAddress["longitude"] + distanceOfLon], function(error, data) {
    client.query('select * from orderwaiting where owlatitude > ? and owlatitude < ? and owlongitude > ? and owlongitude < ? and timestampdiff(second, owdate, date_add(now(), interval 9 hour)) < owwaiting * 60', [mainAddress["latitude"] - distanceOfLat, mainAddress["latitude"] + distanceOfLat, mainAddress["longitude"] - distanceOfLon, mainAddress["longitude"] + distanceOfLon], function(error, data) {
        if(error) {
            console.log(error);
            throw error;
        }

        data.forEach(function(item, index) {
            if(getDistance(mainAddress["latitude"], mainAddress["longitude"], item.owlatitude, item.owlongitude) <= distance) {
                waitingArr.push(item);
            }
        });

        response.send(callback + '(' + JSON.stringify(waitingArr) + ')');
    });
});

app.get('/getRestaurants', function (request, response) {
    var callback = request.query.callback;

    client.query('select rid, rname, rimg, rtype from restaurant', function(error, data) {
        if(error) {
            console.log(error);
            throw error;
        }

        response.send(callback + '(' + JSON.stringify(data) + ')');
    });
});

app.get('/getRestaurant/:id', function (request, response) {
    var restNum = request.params.id;
    var callback = request.query.callback;
    var dataArr = [];

    client.query('select * from restaurant where rid=?', [restNum], function(error, data) {
        if(error) {
            console.log(error);
            throw error;
        }
        dataArr.push(data);

        client.query('select * from menutype where rid=?', [restNum], function(error, data) {
            if(error) {
                console.log(error);
                throw error;
            }
            dataArr.push(data);

            client.query('select * from menu where mtid in (select mtid from menutype where rid=?)', [restNum], function(error, data) {
                if(error) {
                    console.log(error);
                    throw error;
                }
                dataArr.push(data);

                response.send(callback + '(' + JSON.stringify(dataArr) + ')');
            });
        });
    });
});

app.get('/getOptions/:id', function (request, response) {
    var menuNum = request.params.id;
    var callback = request.query.callback;
    var dataArr = [];

    client.query('select * from optiontype where mid=?', [menuNum], function(error, data) {
        if(error) {
            console.log(error);
            throw error;
        }
        dataArr.push(data);

        client.query('select * from options where otid in (select otid from optiontype where mid=?)', [menuNum], function(error, data) {
            if(error) {
                console.log(error);
                throw error;
            }
            dataArr.push(data);
            response.send(callback + '(' + JSON.stringify(dataArr) + ')');
        });
    });
});

app.get('/getMyMatchedOrder', function (request, response) {   //주문매칭시 본인의 주문내역 보여줌
    var personNum = request.query.personNum;
    var orderNum = request.query.orderNum;
    var callback = request.query.callback;
    var dataArr = [];

    client.query('select * from orderperson where odpid=?', [personNum], function(error, data) {
        if(error) {
            console.log(error);
            throw error;
        }
        dataArr.push(data);

        client.query('select oddate from orderlist where olid=?', [orderNum], function(error, data) {
            if(error) {
                console.log(error);
                throw error;
            }

            dataArr[0][0].orderTime = data[0].oddate;

            client.query('select * from orderpersonmenu where odpid=?', [personNum], function(error, orderedMenu) {
                if(error) {
                    console.log(error);
                    throw error;
                }
                dataArr.push(orderedMenu);

                //내가 주문한 메뉴들의 총 옵션갯수 구하기(마지막 옵션 dataArr에 넣고 response.send하기 위해서)
                var optionLength = 0;
                var curOptionLength = 0;

                for(i=0;i<orderedMenu.length;i++) {
                    if(orderedMenu[i]["opid"] != "") {
                        optionLength += orderedMenu[i]["opid"].split(',').length;
                    }
                }

                orderedMenu.forEach(function(item, index) {
                    (function(menu, index) {
                        client.query('select mname, mprice, misoption from menu where mid=?', [menu.mid], function(error, data) {
                            if(error) {
                                console.log(error);
                                throw error;
                            }

                            dataArr[1][index].menuName = data[0].mname;
                            dataArr[1][index].menuPrice = data[0].mprice;
                            dataArr[1][index].options = false;

                            if(menu.opid != "") {
                                var optionNumArr = menu.opid.split(',');
                                var options = [];

                                for(var i=0;i<optionNumArr.length;i++) {
                                    (function(num) {
                                        client.query('select opname, opprice from options where opid=?', [optionNumArr[num]], function(error, data) {
                                            if(error) {
                                                console.log(error);
                                                throw error;
                                            }

                                            curOptionLength++;

                                            var option = {};

                                            option.optionName = data[0].opname;
                                            option.optionPrice = data[0].opprice;

                                            options.push(option);

                                            if(num == optionNumArr.length - 1) {
                                                dataArr[1][index].options = options;

                                                if(curOptionLength == optionLength) {
                                                    response.send(callback + '(' + JSON.stringify(dataArr) + ')');
                                                }
                                            }
                                        });
                                    })(i);
                                }
                            }

                            //모든메뉴에서 선택한 옵션이 없고 마지막 주문한 메뉴까지 dataArr에 넣었을때
                            if(index == orderedMenu.length - 1 && optionLength == 0) {
                                response.send(callback + '(' + JSON.stringify(dataArr) + ')');
                            }
                        });
                    })(item, index);
                });
            });
        });
    });
});

app.get('/orderDecide', function (request, response) {
    var orderStatus = JSON.parse(request.query.orderStatus);
    var mainAddress = JSON.parse(request.query.mainAddress);
    var phone = request.query.phone;
    var require = request.query.require;
    var deviceID = request.query.deviceID;
    var waitingTime = request.query.waitingTime;
    var callback = request.query.callback;

    var matchingChkArr = [];    //주문매칭을 체크하기 위한 배열
    var matchingArr = [];    //매칭이 확정된 주문들을 이 배열에 넣음(데이터를 다른 테이블에 옮기고 해당 주문자들에게 매칭되었음을 알리기 위해)

    if(orderStatus['totalPrice'] >= orderStatus['minPrice']) {   //혼자 주문한게 최소배달금액 넘을경우
        saveOrder(orderStatus["restNum"], function(orderNum) {
            saveOwnData(orderNum, orderStatus, mainAddress, matchingArr, phone, require, deviceID, response, callback, 'complete');  //콜백함수에는 자신의 주문만 저장하는 saveOwnData함수 사용
        });
    }
    else {
        //내주변 100m이내에 주문자 찾음(속도를 높이기위해 1차적으로 구역을 원이아닌 네모로 지정함)
        // client.query('select owid, owlatitude, owlongitude, owaddr, owtotalprice, owphone, owrequire, owdeviceid from orderwaiting where rid=? and owlatitude > ? and owlatitude < ? and owlongitude > ? and owlongitude < ? and timestampdiff(second, owdate, now()) < owwaiting * 60', [orderStatus["restNum"], mainAddress["latitude"] - distanceOfLat, mainAddress["latitude"] + distanceOfLat, mainAddress["longitude"] - distanceOfLon, mainAddress["longitude"] + distanceOfLon], function(error, data) {
        client.query('select owid, owlatitude, owlongitude, owaddr, owtotalprice, owphone, owrequire, owdeviceid from orderwaiting where rid=? and owlatitude > ? and owlatitude < ? and owlongitude > ? and owlongitude < ? and timestampdiff(second, owdate, date_add(now(), interval 9 hour)) < owwaiting * 60', [orderStatus["restNum"], mainAddress["latitude"] - distanceOfLat, mainAddress["latitude"] + distanceOfLat, mainAddress["longitude"] - distanceOfLon, mainAddress["longitude"] + distanceOfLon], function(error, data) {
            if(error) {
                console.log(error);
                throw error;
            }

            if(data.length != 0) {
                for(var i=0;i<data.length;i++) {
                    if(getDistance(mainAddress["latitude"], mainAddress["longitude"], data[i].owlatitude, data[i].owlongitude) <= distance) {
                        var waiting = {};
                        waiting.indexNum = data[i].owid;
                        waiting.latitude = data[i].owlatitude;
                        waiting.longitude = data[i].owlongitude;
                        waiting.totalPrice = data[i].owtotalprice;
                        waiting.address = data[i].owaddr;
                        waiting.phone = data[i].owphone;
                        waiting.require = data[i].owrequire;
                        waiting.deviceID = data[i].owdeviceid;

                        if(orderStatus['totalPrice'] + data[i].owtotalprice >= orderStatus['minPrice']) {   //자신과 한명의 주문이 최소배달금액을 넘을때
                            matchingArr.push(waiting);

                            saveOrder(orderStatus["restNum"], function(orderNum) {
                                //먼저 기존주문자의 정보부터 옮기고 자신의 데이터를 옮김. client.query함수의 비동기 처리방식때문에 saveOwnData를 콜백함수로 넣음
                                changeDBTable(orderNum, 0, matchingArr, function(orderNum) {
                                    saveOwnData(orderNum, orderStatus, mainAddress, matchingArr, phone, require, deviceID, response, callback, 'match');
                                });
                            });

                            break;   //매칭되었으면 더이상 waiting항목 반복문 검사안해야함
                        }
                        else {  //자신과 2명의 주문금액을 합쳐서 최소배달금액을 넘을때
                            if(checkMatching(matchingChkArr, matchingArr, waiting)) {   //매칭이 되었을때
                                saveOrder(orderStatus["restNum"], function(orderNum) {
                                    //먼저 기존주문자의 정보부터 옮기고 자신의 데이터를 옮김. client.query함수의 비동기 처리방식때문에 saveOwnData를 콜백함수로 넣음
                                    changeDBTable(orderNum, 0, matchingArr, function(orderNum) {
                                        saveOwnData(orderNum, orderStatus, mainAddress, matchingArr, phone, require, deviceID, response, callback, 'match');
                                    });
                                });

                                break;   //매칭되었으면 더이상 waiting항목 반복문 검사안해야함
                            }
                            else {    //매칭이 안되었을때
                                matchingChkArr.push(waiting);
                            }
                        }
                    }

                    //waiting목록의 마지막 항목까지 검사했는데 매칭이 안되었을때 자신주문정보를 waiting항목에 넣음
                    if(i == data.length - 1) {
                        standInLineOfWaiting(orderStatus, mainAddress, phone, require, deviceID, waitingTime, response, callback);
                    }
                }
            }
            else {
                standInLineOfWaiting(orderStatus, mainAddress, phone, require, deviceID, waitingTime, response, callback);
            }
        });
    }
});

function getDistance(lat1, lon1, lat2, lon2) {
    var p = 0.017453292519943295;    // Math.PI / 180
    var a = 0.5 - Math.cos((lat2 - lat1) * p)/2 + Math.cos(lat1 * p) * Math.cos(lat2 * p) * (1 - Math.cos((lon2 - lon1) * p))/2;

    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}
function checkMatching(matchingChkArr, matchingArr, waiting) {
    for(var i=0;i<matchingChkArr.length;i++) {
        if(getDistance(matchingChkArr[i].latitude, matchingChkArr[i].longitude, waiting.latitude, waiting.longitude) <= distance) {
            matchingArr.push(matchingChkArr[i]);
            matchingArr.push(waiting);

            return true;
        }
    }

    return false;
}
//주문현황의 각 메뉴별로 선택한 옵션번호를 이어서 하나의 문자열로 만드는 함수
function optionNumToString(menu) {
    var optionNum = '';

    //옵션번호 문자열로 변환
    for(var i=0;i<menu["options"].length;i++) {
        for(var j=0;j<menu["options"][i]["option"].length;j++) {
            if(i == 0 && j == 0) {
                optionNum += menu["options"][i]["option"][j]["optionNum"];
            }
            else {
                optionNum += ',' + menu["options"][i]["option"][j]["optionNum"];   
            }
        }
    }

    return optionNum;
}
//주문매칭되면 해당 주문정보를 생성
function saveOrder(restNum, callback) {
    client.beginTransaction(function(error) {   //commit은 가장 마지막에 실행될 쿼리가 있는 saveOwnData함수에서 함
        if(error) {
            throw error;
        }

        // var orderTime = new Date();
        var orderTime = new Date(new Date().setHours(new Date().getHours() + 9));
        orderTime = orderTime.getFullYear() + '-' + (orderTime.getMonth() + 1) + '-' + orderTime.getDate() + ' ' + orderTime.getHours() + ':' + orderTime.getMinutes() + ':' + orderTime.getSeconds();

        client.query('insert into orderlist (rid, oddate) values (?, ?)', [restNum, orderTime], function(error, data) {
            if(error) {
                console.log(error);
                client.rollback(function() {
                    throw error;
                });
            }

            client.query('select olid from orderlist order by olid desc limit 1', function(error, data) {
                if(error) {
                    console.log(error);
                    client.rollback(function() {
                        throw error;
                    });
                }
                
                callback(data[0]["olid"]);
            });
        });
    });
}
//본인의 주문데이터를 테이블에 저장
function saveOwnData(orderNum, orderStatus, mainAddress, matchingArr, phone, require, deviceID, response, callback, result) {
    client.query('insert into orderperson (olid, odplatitude, odplongitude, odpaddr, odptotalprice, odpphone, odprequire, odpdeviceid) values (?, ?, ?, ?, ?, ?, ?, ?)', [orderNum, mainAddress["latitude"], mainAddress["longitude"], mainAddress["areaAddress"] + ', ' + mainAddress["detailAddr"], orderStatus["totalPrice"], phone, require, deviceID], function(error, data) {
        if(error) {
            console.log(error);
            client.rollback(function() {
                throw error;
            });
        }

        client.query('select odpid from orderperson order by odpid desc limit 1', function(error, data) {
            if(error) {
                console.log(error);
                client.rollback(function() {
                    throw error;
                });
            }

            var personNum = data[0]["odpid"];

            orderStatus["menu"].forEach(function(item, index) {
                var optionNum = '';

                if(item["options"]) {   //옵션이 없을경우 optionNum은 빈문자열값 그대로 저장. 있을경우 옵션번호 합쳐서 문자열로 만들어 저장
                    optionNum = optionNumToString(item);
                }

                client.query('insert into orderpersonmenu (odpid, mid, opid, odpmquantity) values (?, ?, ?, ?)', [personNum, item["menuNum"], optionNum, item["quantity"]], function(error, data) {
                    if(error) {
                        console.log(error);
                        client.rollback(function() {
                            throw error;
                        });
                    }

                    //주문목록의 메뉴들중 마지막 메뉴를 저장한후에 commit함
                    if(index == orderStatus["menu"].length - 1) {
                        client.commit(function(error) {
                            if(error) {
                                console.log(error);
                                client.rollback(function() {
                                    throw error;
                                });
                            }

                            for(var i=0;i<matchingArr.length;i++) {
                                push_data.to = matchingArr[i].deviceID;
                                push_data.notification.title = "주문매칭";
                                push_data.notification.body = "주문이 매칭되었습니다";
                                push_data.data.personNum = matchingArr[i].personNum;
                                push_data.data.orderNum = orderNum;
                                push_data.data.status = 'match';

                                fcm.send(push_data, function(error, response) {
                                    if(error) {
                                        console.log(error);
                                        return;
                                    }
                                });
                            }

                            response.send(callback + '(' + '{"status": "' + result + '", "personNum": ' + personNum + ', "orderNum": ' + orderNum + '}' + ')');
                        });
                    }
                });
            });
        });
    });
}
//본인과 함께 매칭된 다른사람들 데이터를 다른 DB테이블로 옮김. 매개변수 안에있는 객체들의 튜플을 옮김
function changeDBTable(orderNum, index, matchingArr, callback) {
    client.query('insert into orderperson (olid, odplatitude, odplongitude, odpaddr, odptotalprice, odpphone, odprequire, odpdeviceid) values (?, ?, ?, ?, ?, ?, ?, ?)', [orderNum, matchingArr[index]["latitude"], matchingArr[index]["longitude"], matchingArr[index]["address"], matchingArr[index]["totalPrice"], matchingArr[index]["phone"], matchingArr[index]["require"], matchingArr[index]["deviceID"]], function(error, data) {
        if(error) {
            console.log(error);
            client.rollback(function() {
                throw error;
            });
        }

        client.query('select odpid from orderperson order by odpid desc limit 1', function(error, data) {
            if(error) {
                console.log(error);
                client.rollback(function() {
                    throw error;
                });
            }

            var personNum = data[0]["odpid"];
            matchingArr[index].personNum = personNum;

            client.query('select * from orderwaitingmenu where owid=?', [matchingArr[index]["indexNum"]], function(error, data) {
                if(error) {
                    console.log(error);
                    client.rollback(function() {
                        throw error;
                    });
                }

                data.forEach(function(item, index) {
                    client.query('insert into orderpersonmenu (odpid, mid, opid, odpmquantity) values (?, ?, ?, ?)', [personNum, item.mid, item.opid, item.owmquantity], function(error, data) {
                        if(error) {
                            console.log(error);
                            client.rollback(function() {
                                throw error;
                            });
                        }
                    });

                    client.query('delete from orderwaitingmenu where owmid=?', [item.owmid], function(error, data) {
                        if(error) {
                            console.log(error);
                            client.rollback(function() {
                                throw error;
                            });
                        }
                    });
                });

                client.query('delete from orderwaiting where owid=?', [matchingArr[index]["indexNum"]], function(error, data) {
                    if(error) {
                        console.log(error);
                        client.rollback(function() {
                            throw error;
                        });
                    }

                    //client.query함수가 비동기로 실행되기 때문에 재귀함수 사용
                    if(index < matchingArr.length - 1) {
                        index++;
                        changeDBTable(orderNum, index, matchingArr, callback);
                    }
                    else {    //모든 matchingArr배열 안의 주문을 다른 테이블로 옮겼을 경우, 그다음은 본인의 데이터를 저장
                        callback(orderNum);
                    }
                });
            });
        });
    });
}
//매칭이 끝까지 되지 않은경우 orderwaiting테이블에 내 주문정보 저장
function standInLineOfWaiting(orderStatus, mainAddress, phone, require, deviceID, waitingTime, response, callback) {
    client.beginTransaction(function(error) {
        if(error) {
            throw error;
        }

        // var orderTime = new Date();
        var orderTime = new Date(new Date().setHours(new Date().getHours() + 9));
        orderTime = orderTime.getFullYear() + '-' + (orderTime.getMonth() + 1) + '-' + orderTime.getDate() + ' ' + orderTime.getHours() + ':' + orderTime.getMinutes() + ':' + orderTime.getSeconds();

        client.query('insert into orderwaiting (rid, owrname, owlatitude, owlongitude, owaddr, owtotalprice, owminprice, owphone, owrequire, owdeviceid, owdate, owwaiting) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [orderStatus["restNum"], orderStatus["restName"],mainAddress["latitude"], mainAddress["longitude"], mainAddress["areaAddress"] + ', ' + mainAddress["detailAddr"], orderStatus["totalPrice"], orderStatus["minPrice"], phone, require, deviceID, orderTime, waitingTime], function(error, data) {
            if(error) {
                console.log(error);
                client.rollback(function() {
                    throw error;
                });
            }

            client.query('select owid from orderwaiting order by owid desc limit 1', function(error, data) {
                if(error) {
                    console.log(error);
                    client.rollback(function() {
                        throw error;
                    });
                }

                var waitingNum = data[0]["owid"];

                orderStatus["menu"].forEach(function(item, index) {
                    var optionNum = '';

                    if(item["options"]) {   //옵션이 없을경우 optionNum은 빈문자열 그대로 저장. 있을경우 옵션번호 합쳐서 문자열로 만들어 저장
                        optionNum = optionNumToString(item);
                    }

                    client.query('insert into orderwaitingmenu (owid, mid, opid, owmquantity) values (?, ?, ?, ?)', [waitingNum, item["menuNum"], optionNum, item["quantity"]], function(error, data) {
                        if(error) {
                            console.log(error);
                            client.rollback(function() {
                                throw error;
                            });
                        }

                        if(index == orderStatus["menu"].length - 1) {
                            client.commit(function(error) {
                                if(error) {
                                    console.log(error);
                                    client.rollback(function() {
                                        throw error;
                                    });
                                }

                                response.send(callback + '(' + '{"status": "wait"}' + ')');

                                //주문하면 주변사용자에게 푸시알림 발송
                                client.query('select dlatitude, dlongitude, deviceid from deviceinfo where dlatitude > ? and dlatitude < ? and dlongitude > ? and dlongitude < ? and deviceid != ?', [mainAddress["latitude"] - distanceOfLat, mainAddress["latitude"] + distanceOfLat, mainAddress["longitude"] - distanceOfLon, mainAddress["longitude"] + distanceOfLon, deviceID], function(error, data) {
                                    if(error) {
                                        console.log(error);
                                        throw error;
                                    }

                                    for(var i=0;i<data.length;i++) {
                                        if(getDistance(mainAddress["latitude"], mainAddress["longitude"], data[i].dlatitude, data[i].dlongitude) <= distance) {
                                            push_data.to = data[i].deviceid;
                                            push_data.notification.title = "모아구역";
                                            push_data.notification.body = "주변에 주문자가 있습니다";
                                            push_data.data.status = 'wait';

                                            fcm.send(push_data, function(error, response) {
                                                if(error) {
                                                    console.log(error);
                                                    return;
                                                }
                                            });
                                        }
                                    }
                                });
                            });
                        }
                    });
                });
            });
        });
    });
}

app.listen(51154, function () {
    console.log('Server Running at http://127.0.0.1:51154');
});
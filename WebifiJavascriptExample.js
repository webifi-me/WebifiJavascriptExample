var webifi;  //this will reference the Webifi library
var recData = "";
var messages = "";
var sendCounter = 0;
var requestCountTimeout;

var repeatCnt = 1;
var repeatInterval = 10;
var send10 = false;
var repeatTimeout;

//this function runs when the page is finished loading
$(function () {
    webifi = WebifiCreate();
    var networkNames = [];
	
    //set callbacks
    webifi.SetDataReceivedCallback(RecDataCallback);
    webifi.SetConnectionStatusCallback(ConnectionMessageCallback);
    webifi.SetErrorCallback(ErrorCallback);
    //create connect details and network name textboxes and start button
    webifi.WebifiControl("webifiControl");
    //see if previously entered information can be loaded from html5 local storage
    if (typeof (Storage) !== "undefined") {
        if (localStorage.webifiConnectName !== undefined) {
            webifi.SetConnectName(localStorage.webifiConnectName);
        }
        if (localStorage.webifiConnectPassword !== undefined) {
            webifi.SetConnectPassword(localStorage.webifiConnectPassword);
        }
        if (localStorage.webifiNetworkNames !== undefined) {
            networkNames = localStorage.webifiNetworkNames.split("\n");
        }
        else
        {
            networkNames.push("network 1");  //default to "network 1"
        }
    }
    else
    {
        networkNames.push("network 1");  //default to "network 1"
    }
    webifi.SetNetworkNames(networkNames);
    $('#spanSendCount').html(sendCounter.toString());
    requestCountTimeout = setTimeout(RequestCountTimeout, 1000);
});

function RequestCountTimeout() {
    var counters = webifi.GetCounters();
    $('#spanRequestCount').html(counters.download.toString());
    var bufferedAmount = webifi.GetBufferedAmount();
    $('#spanBufferedAmount').html(bufferedAmount.toString());
    requestCountTimeout = setTimeout(RequestCountTimeout, 1000);
}

//enable or disable SSL encryption
function UseEncryptionChanged() {
    if ($('#checkUseEncryption').prop('checked')) {
        webifi.SetUseEncryption(true);
    } else {
        webifi.SetUseEncryption(false);
    }
}

function UseWebSocketChanged() {
    if ($('#checkUseWebSocket').prop('checked')) {
        webifi.SetUseWebSocket(true);
    } else {
        webifi.SetUseWebSocket(false);
    }
}

//called when the send data button is clicked
function SendData() {
    var val;
    var sendData = webifi.CreateSendData();

    sendData.data = $('#textSendData').val();
    sendData.dataType = $('#textDataType').val();
    //if checked add send counter to send data
    if ($('#checkAddSendCountToString').prop('checked')) {
        sendData.data += sendCounter.toString();
    }
    //add session IDs if data is sent to specific devices
    val = $('#textSendToSessionIds').val();
    if (val !== "") {
        var sesIds = val.split(',');
        sendData.toSessionIDs = sesIds;
    }

    //add network names if message must be sent to specific networks
    var val = $('#textAreaToNetworks').val();
    if (val !== "") {
        var networkNames = val.split("\n");  //break lines into network names
        sendData.toNetworks = networkNames;
    }

    var errorCode = webifi.SendData(sendData);
    if (errorCode === "0") {
        //data was sent
    	sendCounter++;
    	$('#spanSendCount').html(sendCounter.toString()); //update send counter value in browser
    } else {
        messages += "Send Error: " + errorCode + "\n";
        messages += webifi.ConvertErrorCodeToString(errorCode) + "\n";
        $('#textAreaMessages').val(messages);
    }
}

//callback functions
function RecDataCallback(data, dataType, from, sender) {
    //check if a discovery response was received
    if (dataType == "Discovery Response") {
        AddMessage("Device Discovered: " + data + ", ID: " + from);
    }
    else {
    	recData += data;
    	$('#textAreaRecData').val(recData);
	}
}

function ErrorCallback(errorCode, sender) {
    messages += "Error: " + errorCode + "\n";
    messages += webifi.ConvertErrorCodeToString(errorCode) + "\n";
    $('#textAreaMessages').val(messages);
}

function ConnectionMessageCallback(connected, sender) {
    if (connected) {
        messages += "Connection successful\n";
        $('#spanSessionID').html(webifi.GetSessionID());

        //after successful connect store webifi connect details to local storage to make it easier to connect next time
        if ($('#checkSaveConnectionDetails').prop('checked')) {
            if (typeof (Storage) !== "undefined") {
                localStorage.setItem("webifiConnectName", webifi.GetConnectName());
                localStorage.setItem("webifiConnectPassword", webifi.GetConnectPassword());
                //convert network names array into string for storing
                var networkNamesArray = webifi.GetNetworkNames();
                var networkNamesStr = "";
                var i;
                for (i = 0; i < networkNamesArray.length; i++) {
                    if (i > 0) {
                        networkNamesStr += "\n";
                    }
                    networkNamesStr += networkNamesArray[i];
                }
                localStorage.setItem("webifiNetworkNames", networkNamesStr);
            }
        }
    } else {
        messages += "Connection failed\n";
    }
    $('#textAreaMessages').val(messages);
}

function AddMessage(message) {
    messages += message + "\n";
    $('#textAreaMessages').val(messages);
}

function ClearRecData() {
    $('#textAreaRecData').val("");
    recData = "";
}

function ClearMessages() {
    $('#textAreaMessages').val("");
    messages = "";
}

function SendDiscovery() {
    webifi.SendDiscovery();
}

function SetInstanceName() {
    webifi.name = $('#textInstanceName').val();
}

function DiscoverableChanged() {
    if ($('#checkDiscoverable').prop('checked')) {
        webifi.SetDiscoverable(true);
    } else {
        webifi.SetDiscoverable(false);
    }
}

function SetDownloadRequestTimeout() {
    webifi.SetDownloadRequestTimeout(parseInt($('#textDownloadRequestTimeout').val()));
}
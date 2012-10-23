
function AdSlot(_name,_type,_time,_zone) {
	this.name = _name;
	this.type = _type;
	this.time = _time;
	this.zone = _zone;
	this.source = "";
	this.seen = false;
	this.playOnce = true;	
}
	
function convertTimeFormat(hhmmss) {
	var _time = hhmmss.substr(0,1)*3600+hhmmss.substr(3,2)*60+hhmmss.substr(6,2)*1;
	return _time
}
	
function constructAdList(responseObj){	
		for (v in AdList) {
			if (AdList[v].type.indexOf("roll") +1 ) {
				var adElement = responseObj.getElementById(AdList[v].name);
				MediaFiles = adElement.getElementsByTagName("MediaFiles");
				URL = MediaFiles[0].getElementsByTagName("URL");
				AdList[v].source = URL[0].childNodes[0].data;
			}
		}
		videoTag.addEventListener('timeupdate',showAdSlots,false);
}	
	 
	 
	 // Loading ads data from defined server
AdsRequest = function (AdObj){
	var http_request = new XMLHttpRequest();
	var script = "bannerTypeHtml:vastInlineBannerTypeHtml:vastInlineHtml";
		
	//constructing list for further populating and sorting
		
	var i1 = 0;
	var i2 = 0;
	var i3 = 0;
	var i4 = 0;
	var zones = "";
	for (v in AdObj.schedule) {
		switch (AdObj.schedule[v].position) {
			case "pre-roll":
				var a = new AdSlot("pre-roll-"+i1,"pre-roll",0,AdObj.schedule[v].zone);
				i1++;
				AdList.push(a);
				break
			case "mid-roll":
				var a = new AdSlot("mid-roll-"+i2,"mid-roll",convertTimeFormat(AdObj.schedule[v].startTime),AdObj.schedule[v].zone);
				i2++;
				AdList.push(a);
				break
			case "post-roll":
				var a = new AdSlot("post-roll-"+i3,"post-roll",0,AdObj.schedule[v].zone);
				i3++;
				AdList.push(a);
				break
			case "auto:bottom":
				var a = new AdSlot("auto:bottom-"+i4,"auto:bottom",convertTimeFormat(AdObj.schedule[v].startTime),AdObj.schedule[v].zone);
				i4++;
				AdList.push(a);
				break
			default:
				break
		} 
	}
	videoTag.addEventListener("canplay",setPostRollTime,false);
	videoTag.load();
		
	for (v in AdList) {
		zones += AdList[v].name +"=" +AdList[v].zone + "|";
	}
	zones = zones.substr(0,zones.length - 1)
		
		
	var nz = "1";
	var format = "vast";
	var charset = "UTF-8";
	var params = "script="+script+"&zones="+encodeURIComponent(zones)+"&nz="+nz+"&format="+format+"&charset="+charset;
	
	http_request.open( "GET",AdObj.servers[0]["apiAddress"]+"?"+params, true );
	http_request.send(null);
	http_request.onreadystatechange = function () {
		if ( http_request.readyState == 4 ) {
			if ( http_request.status == 200 ) {
				var xml = http_request.responseXML;
				constructAdList(xml);
			}
			http_request = null;
		}
	}
};
	 
	 
	 //Parsing parameters from video tag
parseAdsParameters = function (input) {
	var AdObj = !(/[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(input.replace(/"(\\.|[^"\\])*"/g, ''))) &&eval('(' + input + ')');
	return AdObj;
}	 

function enforcePrecision(n, nDecimalDigits){
	return +(n).toFixed(nDecimalDigits);
}
	 
function seekToOriginalPoint() {
	videoTag.removeEventListener('canplaythrough', seekToOriginalPoint, false);
	videoTag.removeEventListener('load', seekToOriginalPoint, false);
	videoTag.currentTime = enforcePrecision(tempTime,1);
	videoTag.play();
	videoTag.addEventListener('timeupdate',showAdSlots,false);
}
	
function resumePlayBackAfterSlotShow() {
	videoTag.removeEventListener('ended',resumePlayBackAfterSlotShow,false);
	videoTag.src = videoTag.mainTrack;
	videoTag.play();
	
	if(videoTag.readyState !== 4){ //HAVE_ENOUGH_DATA
		videoTag.addEventListener('canplaythrough', seekToOriginalPoint, false);
		videoTag.addEventListener('load', seekToOriginalPoint, false); //add load event as well to avoid errors, sometimes 'canplaythrough' won't dispatch.
		videoTag.pause();
		}
}
		
function showSlot(slot) {
	videoTag.src = slot.source;
	videoTag.play();
	videoTag.addEventListener('ended',resumePlayBackAfterSlotShow,false);
}
	
	
function slotForCurrentTime(currentTime){
	for (v in AdList){ 
		if (!AdList[v].seen){
			if (AdList[v].time == currentTime) {
				return AdList[v];
			}
		}
	}
	return null;
		
}
	
	function showAdSlots() {
		
		var slot = slotForCurrentTime(Math.floor(videoTag.currentTime));
		if (slot) {
			slot.seen = true;
			tempTime = videoTag.currentTime;
			videoTag.removeEventListener('timeupdate',showAdSlots,false);
			showSlot(slot);
			
				
		}
      
    }
		
function initAdsFor(videoID) {
	window.tempTime = 0;
	
	window.counterOfStreams = 0;
    window.videoTag = document.getElementById(videoID);
	videoTag.mainTrack = videoTag.src;
	window.AdList = new Array;
	
	
	window.AdObj = parseAdsParameters(videoTag.getAttribute('ads'));
	window.AdsRequest(AdObj);
}
	
function setPostRollTime() {
		videoTag.removeEventListener("canplay",setPostRollTime,false);
		for (v in AdList) {
			if (AdList[v].type == "post-roll") {
				AdList[v].time = Math.floor(videoTag.duration);
			}
		}		
}
	
		 
  




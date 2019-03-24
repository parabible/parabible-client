import React from 'react'
import AccentUnit from './AccentUnit'
import LXXVerse from './LXXVerse'
import SBLVerse from './SBLVerse'
import DataFlow from 'util/DataFlow'

const fontSetting = () => {
	return `"${DataFlow.get("fontSetting")}", "SBL Biblit", "Open Sans", "Arial"`
}

const wlcDisplay = (rid, wlc, activeWid) => (
	wlc.map((accentUnit, i) =>
		<AccentUnit
			key={i}
			verseNumber={i === 0 ? (rid % 1000) : false}
			accentUnit={accentUnit}
			activeWid={activeWid} />
	)
)
const lxxDisplay = (rid, lxx, activeWid) => (
	lxx ? Object.keys(lxx).map(verseUnit => (
		<LXXVerse
			key={verseUnit}
			verseNumber={verseUnit.replace(/^[\d\w]+\s/, "")}
			lxxVerse={lxx[verseUnit]}
			activeWid={activeWid} />
	)) : null
)
const sblDisplay = (rid, sbl, activeWid) => (
	sbl ? <SBLVerse
			key={rid % 1000}
			verseNumber={rid % 1000}
			text={sbl}
			activeWid={activeWid} />
	: null
)
const netDisplay = (rid, net, activeWid) => {
	return <div dangerouslySetInnerHTML={{ __html: net}} />
}

const textHelper = {
	"wlc": {
		styles: { display: "table-cell", verticalAlign: "top", direction: "rtl", fontSize: "x-large", padding: "3px 5px", fontFamily: DataFlow.get("fontSetting")},
		function: wlcDisplay
	},
	"sbl": {
		styles: { display: "table-cell", verticalAlign: "top", padding: "3px 5px", fontSize: "large", fontFamily: DataFlow.get("fontSetting") },
		function: sblDisplay
	},
	"net": {
		styles: { display: "table-cell", verticalAlign: "top", padding: "3px 5px", fontSize: "medium" },
		function: netDisplay
	},
	"lxx": {
		styles: { display: "table-cell", verticalAlign: "top", padding: "3px 5px", fontSize: "large", fontFamily: DataFlow.get("fontSetting") },
		function: lxxDisplay
	}
}
// TODO: Do something actual with fonts for LXX
const parallelView =({rid, activeWid, ridData, thisVerseActive}) => (
	<div className="contiguousrid" data-rid={rid} id={thisVerseActive ? "activeVerse" : ""} style={{display: "table", tableLayout: "fixed", width: "100%", direction: "ltr", backgroundColor: thisVerseActive ? "rgba(255,255,0,0.3)" : "" }}>
		{DataFlow.get(rid >= 400000000 ? "textsToDisplayMainNT" : "textsToDisplayMainOT").map(text => 
			ridData.hasOwnProperty(text) ? <div key={text} style={textHelper[text].styles}>
				{textHelper[text].function(rid, ridData[text], activeWid)}
			</div> : <div key={text} style={textHelper[text].styles} />
		)}
		{/* {ridData.hasOwnProperty("wlc") ? (
			<div style={{ display: "table-cell", verticalAlign: "top", direction: "rtl", fontSize: "x-large", padding: "3px 5px", fontFamily: fontSetting()}}>
				{wlcDisplay(rid, ridData.wlc, activeWid)}
			</div>
		) : ""}
		{ridData.hasOwnProperty("sbl") ? (
			<div style={{ }>
				{sblDisplay(rid, ridData.sbl, activeWid)}
			</div>
		) : ""}
		{ridData.hasOwnProperty("net") ? (
			
		) : ""}
		{ridData.hasOwnProperty("lxx") ? (
			<div style={}>
				{lxxDisplay(rid, ridData.lxx, activeWid)}
			</div>
		) : ""} */}
	</div>
)

const RidView = ({rid, ridData, activeWid}) => {
	const ridDataKeys = Object.keys(ridData)
	const activeVerse = DataFlow.get("activeVerse")
	const thisVerseActive = activeVerse ?
		rid === activeVerse.rid :
		false

	if (ridDataKeys.length > 1) {
		// PARALLEL
		return parallelView({rid, ridData, activeWid, thisVerseActive})
	}
	else {
		// SINGLE TEXT
		switch(ridDataKeys[0]) {
			case "sbl":
				return <div className="contiguousrid" id={thisVerseActive ? "activeVerse" : ""} style={{
						display: "inline",
						fontFamily: DataFlow.get("fontSetting"),
						fontSize: '80%',
						backgroundColor: thisVerseActive ? "rgba(255,255,0,0.3)" : ""
					}} data-rid={rid}>
					{sblDisplay(rid, ridData.sbl, activeWid)}
				</div>
			case "lxx":
				return <div className="contiguousrid" id={thisVerseActive ? "activeVerse" : ""} style={{
						display: "inline",
						fontFamily: DataFlow.get("fontSetting"),
						fontSize: '80%',
						backgroundColor: thisVerseActive ? "rgba(255,255,0,0.3)" : ""
					}} data-rid={rid}>
					{lxxDisplay(rid, ridData.lxx, activeWid)}
				</div>
			case "net":
				return <div className="contiguousrid" id={thisVerseActive ? "activeVerse" : ""} style={{
						display: "inline",
						fontSize: '80%',
						backgroundColor: thisVerseActive ? "rgba(255,255,0,0.3)" : ""
					}} data-rid={rid}>
					<span dangerouslySetInnerHTML={{ __html: ridData.net}} />
				</div>
			case "wlc":
				return <div className="contiguousrid" id={thisVerseActive ? "activeVerse" : ""} style={{
						display: "inline",
						fontFamily: DataFlow.get("fontSetting"),
						backgroundColor: thisVerseActive ? "rgba(255,255,0,0.3)" : ""
					}} data-rid={rid}>
					{wlcDisplay(rid, ridData.wlc, activeWid)}
				</div>
			default:
				return <div style={{ display: "inline" }} data-rid={rid}>
					{ridData[ridDataKeys[0]]}
				</div>
		}
	}
}
export default RidView
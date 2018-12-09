import React from 'react'
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar'
import { ContextualMenuItemType } from 'office-ui-fabric-react/lib/ContextualMenu'
import generateSearchTermMenuItem from './SearchTermMenuItem'

import DataFlow from 'util/DataFlow'
import ApiRequest from 'util/ApiRequest'
import bookDetails from 'data/bookDetails'
import AppNotify from 'util/AppNotify'

import { isNewTestament } from 'util/ReferenceHelper'

class ParabibleHeader extends React.Component {
	constructor(props) {
		super(props)
		this.state = DataFlow.bindState([
			"highlightTermsSetting",
			"screenSizeIndex",
			"reference",
			"screenSizeIndex",
			"searchTerms",
			"textsToDisplayMainOT",
			"textsToDisplayMainNT",
			"stripDiacritics"
		], this.setState.bind(this))
	}
	generateSettingsMenu(menuData, multiple=false) {
		const searchField = DataFlow.get(menuData.field)
		const isChecked = (itemName) => {
			return multiple ? 
				(searchField.indexOf(itemName) !== -1) :
				(searchField == itemName)
		}
		const clickHandler = (itemName) => {
			return multiple ? () => {
					const index = searchField.indexOf(itemName)
					if (index === -1) {
						DataFlow.set(menuData.field, searchField.concat(itemName))
					}
					else {
						var newArray = searchField.slice()
						newArray.splice(index, 1)
						DataFlow.set(menuData.field, newArray)
					}
					this.forceUpdate()
				} : () => {
					DataFlow.set(menuData.field, itemName)
					this.forceUpdate()
				}
		} 

		return menuData.items.map(item => ({
			key: item.name,
			name: item.title,
			disabled: item.disabled || false,
			iconProps: {
				iconName: isChecked(item.name) ? "CheckboxComposite" : "Checkbox"
			},
			onClick: clickHandler(item.name)
		}))
	}

	moveChapter(direction) {
		var referenceArray = bookDetails.reduce((previousValue, currentValue) => {
			var newReferences = [...Array(currentValue.chapters).keys()].map((i) => ({ "book": currentValue.name, "chapter": i + 1 }))
			return previousValue.concat(newReferences)
		}, [])
		var curr_ref = DataFlow.get("reference")
		var index = referenceArray.findIndex((item) => item.chapter == curr_ref.chapter && item.book == curr_ref.book)
		var newIndex = index + direction
		newIndex = newIndex >= 0 ? newIndex : referenceArray.length - 1
		newIndex = newIndex < referenceArray.length ? newIndex : 0

		DataFlow.set("reference", referenceArray[newIndex])
		ga('send', {
			hitType: 'event',
			eventCategory: 'navigate',
		})
	}

	doSearch() {
		if (this.state.searchTerms.length === 0) {
			AppNotify.send({
				type: "warning",
				message: "You have not created any search terms. Click on a word, choose an attribute to search for and click the 'Create Search Term' button."
			})
			return
		}
		const type = DataFlow.get("searchTypeSetting")
		switch(type) {
			case "normal":
				ApiRequest("termSearch")
				break
			case "wordStudy":
			case "collocation":
				break
		}
		ga('send', {
			hitType: 'event',
			eventCategory: 'search',
			eventAction: type
		})
	}

	render() {
		let nearItemList = [{
				key: 'previousChapter',
				name: "",
				iconProps: {
					iconName: 'ChevronLeftSmall'
				},
				onClick: () => this.moveChapter(-1)
			}, {
				key: 'location',
				name: this.state.reference ? this.state.reference.book + " " + this.state.reference.chapter : "Select a chapter",
				style: { fontWeight: "bold", fontSize: "large" },
				iconProps: {
					iconName: 'Dictionary',
					style: {
						color: 'black'
					}
				},
				onClick: this.props.showBookSelector
			}, {
				key: 'nextChapter',
				name: "",
				iconProps: {
					iconName: 'ChevronRightSmall'
				},
				onClick: () => this.moveChapter(1)
			}
		]

		const externalLinkItems = [{
				key: 'section',
				itemType: ContextualMenuItemType.Header,
				name: "Open Externally"
			}, {
				key: 'biblebento',
				name: "BibleBento",
				iconProps: {
					iconName: 'Link'
				},
				onClick: () => {
					const chapter = this.state.reference.chapter
					const currentBookDetail = bookDetails.find(b => b.name == this.state.reference.book)
					const bentoBook = currentBookDetail.bentoBook
					window.open(`https://biblebento.com/index.html?bhs&${bentoBook}.${chapter}.1`,'_blank')
				}
			}
		]
		//Fixes #18
		if (!isNewTestament(this.state.reference)) {
			externalLinkItems.splice(1, 0, {
				key: 'shebanq',
				name: "Shebanq",
				iconProps: {
					iconName: 'Link'
				},
				onClick: () => {
					const chapter = this.state.reference.chapter
					const currentBookDetail = bookDetails.find(b => b.name == this.state.reference.book)
					const shebanqBook = currentBookDetail.shebanqBook
					window.open(`http://shebanq.ancient-data.org/hebrew/text?book=${shebanqBook}&chapter=${chapter}&mr=m`,'_blank')
				}
			})
		}
		
		if (this.state.screenSizeIndex > 2) {
			nearItemList.push({
				key: 'external',
				name: "",
				iconProps: {
					iconName: 'OpenInNewWindow'
				},
				subMenuProps: { items: externalLinkItems}
			})
		}

		const searchTermMenuItems = this.state.searchTerms.map(t => generateSearchTermMenuItem({uid:t.uid}))

		const menuRange = {
			"field": "searchRangeSetting",
			"items": [
				{ name: 'phrase', title: 'Phrase' },
				{ name: 'clause', title: 'Clause' },
				{ name: 'sentence', title: 'Sentence' },
				{ name: 'verse', title: 'Verse' }
			]
		}
		const searchRangeItems = this.generateSettingsMenu(menuRange)


		// const menuType = {
		// 	"field": "searchTypeSetting",
		// 	"items": [
		// 		{ name: 'normal', title: 'Normal' },
		// 		//TODO: add these back in
		// 		// { name: 'collocation', title: 'Collocation' },
		// 		// { name: 'wordStudy', title: 'Word Study' }
		// 	]
		// }
		// const searchTypeItems = this.generateSettingsMenu(menuType)


		const menuFilter = {
			"field": "searchFilterSetting",
			"items": [
				{ name: 'none', title: 'None' },
				{ name: 'current', title: 'Current' },
				{ name: 'pentateuch', title: 'Pentateuch' },
				{ name: 'minorProphets', title: 'Minor Prophets' },
				{ name: 'wisdomBooks', title: 'Wisdom Books' },
				// TODO: { name: 'custom', title: 'Custom' }
			]
		}
		const searchFilterItems = this.generateSettingsMenu(menuFilter)


		// TODO: whatever is required to not force the WLC
		const otItems = [
			{ name: 'wlc', title: 'BHS (Hebrew)' },
			{ name: 'lxx', title: 'LXX (Greek)' },
			{ name: 'net', title: 'NET (English)' },
		]
		const ntItems = [
			{ name: 'sbl', title: 'SBL GNT (Greek)' },
			{ name: 'net', title: 'NET (English)' },
		]
		if (this.state.textsToDisplayMainOT.length === 1) {
			const requiredIndex = otItems.findIndex(i => i.name === this.state.textsToDisplayMainOT[0])
			otItems[requiredIndex]["disabled"] = true
		}
		if (this.state.textsToDisplayMainNT.length === 1) {
			const requiredIndex = ntItems.findIndex(i => i.name === this.state.textsToDisplayMainNT[0])
			ntItems[requiredIndex]["disabled"] = true
		}
		
		const menuOTTextsToDisplayMain = {
			"field": "textsToDisplayMainOT",
			"items": otItems
		}
		const otTextsToDisplayMainItems = this.generateSettingsMenu(menuOTTextsToDisplayMain, true)
		const menuNTTextsToDisplayMain = {
			"field": "textsToDisplayMainNT",
			"items": ntItems
		}
		const ntTextsToDisplayMainItems = this.generateSettingsMenu(menuNTTextsToDisplayMain, true)
		const textsToDisplayMainItems = [{
				key: 'otsection',
				itemType: ContextualMenuItemType.Section,
				sectionProps: {
					topDivider: true,
					bottomDivider: true,
					title: 'Old Testament',
					items: otTextsToDisplayMainItems
				}
			},
			{
				key: 'ntsection',
				itemType: ContextualMenuItemType.Section,
				sectionProps: {
					topDivider: true,
					bottomDivider: true,
					title: 'New Testament',
					items: ntTextsToDisplayMainItems
				}
			}
		]
		// const menuTextsToDisplaySearch = { 
		// 	"field": "textsToDisplaySearch", 
		// 	"items": [ 
		// 	  { name: 'wlc', title: 'BHS (Hebrew)' }, 
		// 	  { name: 'lxx', title: 'LXX (Greek)' }, 
		// 	  { name: 'sbl', title: 'SBL GNT (Greek)' }, 
		// 	  { name: 'net', title: 'NET (English)' }, 
		// 	]
		// }
		// const textsToDisplaySearchItems = this.generateSettingsMenu(menuTextsToDisplaySearch, true)
		// TODO: whatever is required to not force the WLC
		// textsToDisplaySearchItems[0]["disabled"] = true

		
		const searchSettingsItems = [
			{
				key: 'searchRange',
				name: 'Search Range',
				iconProps: {
					iconName: "Switch"
				},
				subMenuProps: { items: searchRangeItems }
			}, {
				key: 'searchFilter',
				name: 'Search Filter',
				iconProps: {
					iconName: "Filter"
				},
				subMenuProps: { items: searchFilterItems }
			}, {
			// 	key: 'searchType',
			// 	name: 'Search Type',
			// 	iconProps: {
			// 		iconName: "Library"
			// 	},
			// 	subMenuProps: { items: searchTypeItems }
			// }, {
				key: 'highlight',
				name: 'Highlight Terms',
				iconProps: {
					iconName: this.state.highlightTermsSetting ? "CheckboxComposite" : "Checkbox"
				},
				onClick: () => DataFlow.set("highlightTermsSetting", !this.state.highlightTermsSetting)
			}
		]
		if (this.state.searchTerms.length > 0) {
			searchSettingsItems.push({
				key: 'clearTerms',
				name: 'Clear Search Terms',
				iconProps: {
					iconName: 'Trash',
					style: {
						color: 'red'
					}
				},
				onClick: () => {
					DataFlow.set("searchTerms", [])
					this.forceUpdate()
					ga('send', {
						hitType: 'event',
						eventCategory: 'searchTerms',
						eventAction: "removeAll"
					})
				}
			})
		}
		//TODO: Add font settings
		const generalSettingsItems = [
			// {
			// 	key: 'fontSettings',
			// 	name: 'Font Settings',
			// 	iconProps: {
			// 		iconName: "Font"
			// 	}
			// },
			{
				key: 'textViewMainSettings',
				name: 'Display Texts', //Parallel View? Syntax Diagram? Highlight Search Terms?
				iconProps: {
					iconName: "ListMirrored"
				},
				subMenuProps: { "items": textsToDisplayMainItems }
			// }, {
			// 	key: 'textViewSearchSettings',
			// 	name: 'Search Results Texts', //Parallel View? Syntax Diagram? Highlight Search Terms?
			// 	iconProps: {
			// 		iconName: "SetAction"
			// 	},
			// 	subMenuProps: { "items": textsToDisplaySearchItems }
			}, {
				key: 'morphologySettings',
				name: 'Morphology Settings', //Which fields to show
				onClick: this.props.showMorphSettings,
				iconProps: {
					iconName: "GroupedList"
				}
			}, {
				key: "stripDiacriticsToggle",
				name: "Strip Diacritics (on copy)",
				iconProps: {
					iconName: this.state.stripDiacritics ? "CheckboxComposite" : "Checkbox"
				},
				onClick: function () {
					DataFlow.set("stripDiacritics", !DataFlow.get("stripDiacritics"))
				}
			}
		]

		const searchMenuItem = {
			key: "search",
			name: this.state.screenSizeIndex < 2 || this.state.screenSizeIndex == 4 ? "Search" : "",
			icon: "Search",
			onClick: this.doSearch.bind(this)
		}
		const searchTermParentItem = {
			key: "searchTerms",
			name: this.state.screenSizeIndex < 2 ? "Search Terms" : "",
			icon: "CollapseMenu",
			subMenuProps: { items: searchTermMenuItems }
		}

		const rightItemList = [
			{
				key: "searchSettings",
				name: this.state.screenSizeIndex < 2 || this.state.screenSizeIndex == 4 ? "Search Tools" : "",
				icon: "Settings",
				subMenuProps: { items: searchSettingsItems }
			},
			{
				key: "generalSettings",
				name: this.state.screenSizeIndex < 2 || this.state.screenSizeIndex == 4 ? "View" : "",
				icon: "ColumnOptions",
				subMenuProps: { items: generalSettingsItems }
			},
		]

		var farItemList = {}
		switch (this.state.screenSizeIndex) {
			case 0:
			case 1:
				farItemList = [{
					key: "faritems",
					name: "",
					icon: "Waffle",
					subMenuProps: { items: [
						searchMenuItem,
						searchTermParentItem,
						...rightItemList
					]}
				}]
				if (this.state.searchTerms.length === 0)
					farItemList[0].subMenuProps.items.splice(1, 1)
				break;
			case 2:
				farItemList = [
					searchMenuItem,
					searchTermParentItem,
					...rightItemList
				]
				if (this.state.searchTerms.length === 0)
					farItemList.splice(1, 1)
				break;
			case 3:
				farItemList = [
					searchMenuItem,
					...searchTermMenuItems,
					...rightItemList
				]
				break;
			case 4:
				farItemList = [
					searchMenuItem,
					...searchTermMenuItems,
					...rightItemList
				]
				break;
		}

		return <CommandBar
			isSearchBoxVisible={false}
			items={nearItemList}
			farItems={farItemList}
		/>
	}
}

export default ParabibleHeader

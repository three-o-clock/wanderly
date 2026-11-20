// Place types drive the page background. Swap any image URL here.
const U = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=2000&q=70`
export const PLACE_TYPES = ['Mountains', 'Beaches', 'City', 'Desert', 'Heritage', 'Wildlife']
const BG = {
  Mountains: U('photo-1464822759023-fed622ff2c3b'),
  Beaches: U('photo-1507525428034-b723cf961d3e'),
  City: U('photo-1480714378408-67cf0d13bc1b'),
  Desert: U('photo-1509316785289-025f5b846b35'),
  Heritage: U('photo-1564507592333-c60657eea523'),
  Wildlife: U('photo-1448375240586-882707db888b'),
}
let base = 'Beaches' // background of the user's current/next trip
const apply = type => document.body.style.setProperty('--bg', `url("${BG[type] || BG.Beaches}")`)
// Trip pages call this: it also becomes the background to return to.
export const setBackground = type => { base = type; apply(type) }
// Explore and Match & Go call this when a place-type chip is picked. 'All' goes back to the trip background.
export const previewBackground = type => apply(type === 'All' ? base : type)
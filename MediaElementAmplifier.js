/**
 * @license Copyright 2017 - Chris West - MIT Licensed
 * Prototype to easily set the volume (actual and perceived), loudness,
 * decibels, and gain value.
 */
function MediaElementAmplifier(mediaElem) {
  this._context = new (window.AudioContext || window.webkitAudioContext);
  this._source = this._context.createMediaElementSource(this._element = mediaElem);
  this._source.connect(this._gain = this._context.createGain());
  this._gain.connect(this._context.destination);
}
[
  'getContext',
  'getSource',
  'getGain',
  'getElement',
  [
    'getVolume',
    function(opt_getPerceived) {
      return (opt_getPerceived ? this.getLoudness() : 1) * this._element.volume;
    }
  ],
  [
    'setVolume',
    function(value, opt_setPerceived) {
      this._element.volume = value / (opt_setPerceived ? this.getLoudness() : 1);
    }
  ],
  [ 'getGainValue', function() { return this._gain.gain.value; } ],
  [ 'setGainValue', function(value) { this._gain.gain.value = value; } ],
  [ 'getDecibels', function() { return 20 * Math.log10(this.getGainValue()); } ],
  [ 'setDecibels', function(value) { this.setGainValue(Math.pow(10, value / 20)); } ],
  [ 'getLoudness', function() { return Math.pow(2, this.getDecibels() / 10); } ],
  [ 'setLoudness', function(value) { this.setDecibels(10 * Math.log2(value)); } ]
].forEach(function(name, fn) {
  if ('string' == typeof name) {
    fn = function() { return this[name.replace('get', '').toLowerCase()]; };
  }
  else {
    fn = name[1];
    name = name[0];
  }
  MediaElementAmplifier.prototype[name] = fn;
});

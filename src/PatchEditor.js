import React from "react";

import { Wave, Gain, Envelope, Filter } from "@jonathanhunsucker/audio-js";

export function Seconds(value) {
  return value.toFixed(3) + "s";
}

export function Percentage(value) {
  return Math.round(value.toFixed(2) * 100) + "%";
}

export function Frequency(value) {
  var scale = "";

  if (value >= 1000) {
    value /= 1000;
    scale = "k";
  }

  return `${value.toFixed(3)} ${scale}Hz`;
}

function WaveControls(wave, handleControlChange) {
  return (
    <React.Fragment>
      <label htmlFor="type">Type</label>:{' '}
      <select name="type" id="type" value={wave.type} onChange={(e) => handleControlChange(e.target.name, e.target.value)}>
        <option value="triangle">Triangle</option>
        <option value="sine">Sine</option>
        <option value="square">Square</option>
        <option value="sawtooth">Sawtooth</option>
      </select>
    </React.Fragment>
  );
}

export function ScaledInput(props) {
  const base = props.base || 3;
  const scale = (value) => Math.pow(value, base);
  const unscale = (value) => Math.pow(value, 1 / base);

  return (
    <input
      type="range"
      style={{verticalAlign: "middle"}}
      value={unscale(props.value)}
      min={unscale(props.min)}
      step={0.01}
      max={unscale(props.max)}
      onChange={(e) => props.onChange(scale(e.target.valueAsNumber))}
    />
  );
}

function EnvelopeControls(envelope, handleControlChange) {
  return (
    <React.Fragment>
      <label htmlFor="attack">Attack</label>:{' '}
      <ScaledInput
        value={envelope.attack} min={0} max={1}
        onChange={(value) => handleControlChange("attack", value)}
      />{' '}{Seconds(envelope.attack)}
      <br />
      <label htmlFor="decay">Decay</label>:{' '}
      <ScaledInput
        value={envelope.decay} min={0} max={1}
        onChange={(value) => handleControlChange("decay", value)}
      />{' '}{Seconds(envelope.decay)}
      <br />
      <label htmlFor="sustain">Sustain</label>:{' '}
      <ScaledInput
        base={1}
        value={envelope.sustain} min={0} max={1}
        onChange={(value) => handleControlChange("sustain", value)}
      />{' '}{Percentage(envelope.sustain)}
      <br />
      <label htmlFor="Release">Release</label>:{' '}
      <ScaledInput
        value={envelope.release} min={0} max={1}
        onChange={(value) => handleControlChange("release", value)}
      />{' '}{Seconds(envelope.release)}
    </React.Fragment>
  );
}

function FilterControls(filter, handleControlChange) {
  return (
    <React.Fragment>
      <label htmlFor="type">Type</label>:{' '}
      <select name="type" id="type" value={filter.type} onChange={(e) => handleControlChange(e.target.name, e.target.value)}>
        <option value="lowpass">Lowpass</option>
        <option value="highpass">Highpass</option>
        <option value="bandpass">Bandpass</option>
      </select>
      <br />
      <label htmlFor="frequency">Frequency</label>:{' '}
      <ScaledInput
        value={filter.frequency} min={0} max={16000}
        onChange={(value) => handleControlChange("frequency", value)}
      />{' '}{Frequency(filter.frequency)}
    </React.Fragment>
  );
}

function UnknownControls(unknown) {
  return "Unknown controls";
}

function ControlsDelegate(stage, handleControlChange) {
  switch (stage.kind) {
    case Wave.kind:
      return WaveControls(stage, handleControlChange);
    case Envelope.kind:
      return EnvelopeControls(stage, handleControlChange);
    case Filter.kind:
      return FilterControls(stage, handleControlChange);
    default:
      return UnknownControls(stage, handleControlChange);
  }
}

function Stage(stage, setStage) {
  const handleControlChange = (name, value) => {
    const updated = stage.constructor.parse(Object.assign({}, stage.toJSON(), {[name]: value}));
    setStage(updated);
  };

  return (
    <form>
      <fieldset>
        <legend style={{textTransform: "capitalize"}}>{stage.toJSON().kind || "Unknown"}</legend>
        {ControlsDelegate(stage.toJSON(), handleControlChange)}
      </fieldset>
    </form>
  );
}

function StageTree(stage, setStage) {
  const rewriteUpstream = (updated, index) => {
    const json = stage.toJSON();
    json.upstreams[index] = updated.toJSON();
    const rewritten = stage.constructor.parse(json);
    setStage(rewritten);
  };

  const rewriteStage = (updated) => {
    setStage(updated);
  };

  return (
    <React.Fragment>
      {stage.upstreams &&
        <React.Fragment>
          {stage.upstreams.map((upstream, index) => {
            return <React.Fragment key={index}>
              {StageTree(upstream, (updated) => rewriteUpstream(updated, index))}
            </React.Fragment>;
          })}
        </React.Fragment>
      }
      {Stage(stage, (updated) => rewriteStage(updated))}
    </React.Fragment>
  );
}

const PatchEditor = React.memo(function PatchEditor(props) {
  return StageTree(props.patch, props.setPatch);
});

export default PatchEditor;

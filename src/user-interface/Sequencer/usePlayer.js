import React, { useRef, useState } from "react";

import { Binding, Gain } from "@jonathanhunsucker/audio-js";

import { flatten } from "@/utility/math.js";
import { asFloat } from "@/utility/rational.js";

import Beat from "@/music/Beat.js";

import Expiration, { policy } from "./Expiration.js";

import useExcisedUponRemovalList from "./useExcisedUponRemovalList.js";

import useWebAudioAPIClock from "./useWebAudioAPIClock.js";

export default function usePlayer(audioContext, destination, sequence) {
  const lastTickedAtRef = useRef({time: null, beat: null});
  const lastScheduledAtRef = useRef({time: null, beat: null}); // farthest out in time we've seen
  const lookaheadInSeconds = .500;

  /**
   * @param {Beat} beat
   * @param {float} time
   *
   * @returns {Expiration[]}
   */
  function schedule(beat, time) {
    const expirations = flatten(
      sequence.tracks.map((track) => {
        return track.placements.map((placement) => {
          const period = track.getPeriodFromPlacement(placement);
          if (period.spans(beat) === false) {
            return [];
          }

          const relativeBeat = beat.minus(placement.beat);

          return track.phrases[placement.phraseId].findHits({beginningOn: relativeBeat}).map((hit) => {
            const boundPatch = track.patchForPitch(hit.note.pitch).bind(hit.note.frequency);
            // BUG 50ms breathing room, should be determined by the track's patch, not hardcoded
            const expiresOn = time + Math.max(asFloat(hit.duration) * sequence.secondsPerBeat(), 0.050);
            return new Expiration(boundPatch, expiresOn);
          });
        });
      })
    );

    const binding = new Binding(
      new Gain(1.0),
      null,
      expirations.map((expiration) => expiration.binding)
    );

    binding.play(audioContext, destination, time);

    return expirations;
  }

  useWebAudioAPIClock(audioContext, () => {
    if (isPlaying === false) {
      return;
    }

    const now = audioContext.currentTime;
    const divisionDurationInSeconds = sequence.secondsPerBeat() / sequence.divisions;
    const relativeAdvancementInSeconds = now - lastTickedAtRef.current.time;

    const shouldPlayNextBeat = divisionDurationInSeconds < relativeAdvancementInSeconds;
    if (shouldPlayNextBeat) {
      const latestBeat = currentBeat.plus(sequence.tickSize);
      if (!latestBeat.modulo(sequence.timeSignature).equals(latestBeat)) {
        setIsPlaying(false);
        return;
      }

      setCurrentBeat(latestBeat);
    }

    const horizonTime = now + lookaheadInSeconds;
    const toSchedule = [];
    while (true) {
      const beat = lastScheduledAtRef.current.beat !== null ? lastScheduledAtRef.current.beat.plus(sequence.tickSize) : new Beat(1, [0, 0]);
      const at = lastScheduledAtRef.current.time !== null ? lastScheduledAtRef.current.time + divisionDurationInSeconds : 0;

      if (at >= horizonTime) {
        break;
      }

      const scheduled = { beat: beat, time: at };
      toSchedule.push(scheduled);
      lastScheduledAtRef.current = scheduled;
    }

    toSchedule.map(({beat, time}) => {
      const newPendingExpirations = schedule(beat, time);
      exciseByPolicyAndAppend(policy.expiredAfter(audioContext.currentTime), newPendingExpirations);
    });
  });

  const [currentBeat, setCurrentBeatInternal] = useState(null);
  const setCurrentBeat = (beat) => {
    lastTickedAtRef.current = {time: audioContext.currentTime, beat: beat};
    setCurrentBeatInternal(beat);
  };
  const [isPlaying, setIsPlayingInternal] = useState(false);
  const setIsPlaying = (isPlaying) => {
    if (isPlaying) {
      const beat = currentBeat === null ? new Beat(1, [0, 0]) : currentBeat.plus(sequence.tickSize);
      setCurrentBeat(beat);
      lastScheduledAtRef.current = {time: audioContext.currentTime, beat: null};
    } else {
      setCurrentBeat(new Beat(1, [0, 0]));
    }
    setIsPlayingInternal(isPlaying);
  };
  const exciseByPolicyAndAppend = useExcisedUponRemovalList((expiration) => expiration.expire());

  return [
    currentBeat,
    [
      isPlaying,
      (newIsPlaying) => {
        // sometimes when pausing, notes are left playing
        exciseByPolicyAndAppend(policy.all(), []);
        setIsPlaying(newIsPlaying);
      },
    ],
  ];
}


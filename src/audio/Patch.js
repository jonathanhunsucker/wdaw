import { Gain, Envelope, Wave, Filter, Noise } from "@jonathanhunsucker/audio-js";

import { assert, instanceOf, anInteger, aString, any } from "@/utility/type.js";

export const aPatch = () => any([Gain, Envelope, Wave, Filter, Noise].map((stage) => instanceOf(stage)));

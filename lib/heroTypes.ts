// Hero customization types — v1 is single gender, Conan-muscular build.
// Expanded gender/body-type support is future scope.

export type AgeBand = "young" | "middle" | "grizzled";

export type SkinTone =
  | "pale"
  | "olive"
  | "tan"
  | "bronze"
  | "dark"
  | "weathered_tan";

export type HairColor =
  | "black"
  | "brown"
  | "blond"
  | "red"
  | "grey"
  | "white";

export type HairLength = "short" | "medium" | "long" | "bald";

export type FacialHair = "clean" | "stubble" | "beard" | "full_beard";

export type EyeColor =
  | "blue"
  | "green"
  | "brown"
  | "grey"
  | "amber"
  | "violet";

export type ScarCount = "none" | "few" | "many";

/**
 * Identity fields that persist across rebirth at the Church of Perpetual
 * Life. These describe WHO the hero is — racial baseline, face, hair,
 * eyes, age band. They do NOT describe accumulated body state (scars,
 * tan, eye patches, brands, bandages, blood). Body state is runtime-
 * accumulated and wipes on death.
 *
 * Stored verbatim in `hero_masters.customization_vector` (jsonb).
 *
 * IMPORTANT: if any field changes meaning, every pre-existing hero's
 * Identity Block becomes inconsistent with its master image. Prefer
 * adding new optional fields over changing existing ones.
 */
export interface HeroCustomization {
  /**
   * Guaranteed-unique identifier. Assigned once by the forge script the
   * first time this hero is generated and written back to the seed JSON.
   * Becomes the primary key in the `hero_masters` table. Opaque UUID;
   * never edit by hand.
   */
  id?: string;
  heroName: string;
  ageBand: AgeBand;
  skinTone: SkinTone;
  hairColor: HairColor;
  hairLength: HairLength;
  facialHair: FacialHair;
  eyeColor: EyeColor;
  /**
   * Optional and generally absent. The library hero is fresh-rebirth
   * state with no accumulated damage. Runtime body state (scars,
   * eye patches, brands, missing fingers) is layered at render time
   * and wipes on death — it does not live on the identity.
   */
  scarCount?: ScarCount;
  /**
   * Optional and generally absent for the same reason as scarCount.
   */
  distinguishingMark?: string;
}

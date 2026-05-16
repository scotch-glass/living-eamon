import { ZoneType } from "./travelMatrix";

const FLAVOR_POOLS: Record<ZoneType, string[]> = {
  civilization: [
    "Farmsteads and stone walls line the road. Children wave from the gates.",
    "The road is well-worn and marked with guild milestones.",
    "A merchant's caravan passes heading the other way, bound for Valus.",
    "The smell of woodsmoke and cooking drifts from a waystation ahead.",
    "A toll-keeper waves you through with barely a glance at your guild seal.",
  ],
  plains: [
    "Flat grassland stretches to the horizon. The wind bends the wheat in slow waves.",
    "A hawk circles overhead. The road is little more than a track in the dry earth.",
    "Heat rises from the plain. Nothing moves in the middle distance.",
    "The grass thins and the soil reddens. Distant hills mark the edge of the plain.",
    "An empty cattle pen, gate hanging open. No sign of what emptied it.",
  ],
  forest_valley: [
    "Dense green canopy closes overhead. The road narrows between the roots.",
    "Bird calls echo through the trees. Something larger moves in the undergrowth.",
    "A cold stream crosses the path. Mossy stones make poor footing.",
    "The forest deepens. Light comes down in long gold shafts through the leaves.",
    "An old way-marker, barely readable. The carving shows a sword crossed with a staff.",
  ],
  mountain: [
    "The trail switchbacks up loose scree. Your lungs burn in the thin air.",
    "Wind howls through the pass. Loose stones clatter down the slope below.",
    "Snow lingers in the shadowed couloirs even in this season.",
    "A cairn marks the high point of the pass. The valley lies far below.",
    "The road here is ancient — dressed stone slabs, cracked and heaved by frost.",
  ],
  cold_north: [
    "Gray skies press down. The trees are stunted and twisted by years of wind.",
    "Frost clings to the undergrowth. The road is frozen mud.",
    "A distant horn sounds — a hunting party, or a warning.",
    "The land empties. You have not seen a farmstead in two days.",
    "A gray keep on a gray hill, no banner flying, no smoke from the chimneys.",
  ],
  desert: [
    "The heat is absolute. Sand fills your boots and works into every crease.",
    "A dust devil spins across the flats and dissolves.",
    "No water. You ration your waterskin. The horizon shimmers and lies.",
    "Crumbled ruins half-buried in sand. No inscription remains.",
    "The night is cold enough for frost. The desert does not forgive the unprepared.",
  ],
  coastal_sea: [
    "Salt spray. The ship creaks and rolls in a long deep-ocean swell.",
    "Flying fish leap from the bow wave and vanish back into the dark.",
    "The coast has dropped below the horizon. Only water in every direction.",
    "A squall builds to the west. The captain orders the sails shortened.",
    "Phosphorescence trails from the hull in the night watch.",
  ],
  river: [
    "The river runs brown and fast beside the road. Herons stand motionless in the shallows.",
    "A ferryman calls his rate across the water. You pay and cross.",
    "River smell — mud and reeds and distant rain somewhere upstream.",
    "The current is high from recent rains. The ford is knee-deep and fast.",
    "Flat-bottomed trading barges work upriver against the current.",
  ],
  jungle_fringe: [
    "The jungle presses in on both sides. The road is reclaiming itself with vines.",
    "Insects mass in living clouds. The heat here is wet and close.",
    "Something watches from the canopy. You do not see it, only feel it.",
    "Riotous flowering trees, brilliant and indifferent to everything beneath.",
    "A broken statue at the roadside. The face has been deliberately effaced.",
  ],
  deep_jungle: [
    "The sky is invisible. You have not seen it for hours.",
    "A Serpent-Man temple foundation emerges from the undergrowth and is swallowed again.",
    "The jungle has grown over something immense. You cannot tell what it was.",
    "No wind. No birdsong. An absolute watchful silence.",
    "The air tastes of something old — copper and wet stone and centuries.",
  ],
  frontier: [
    "The road ends at a cairn of stacked stones. Beyond, no map applies.",
    "Charred ruins of an outpost. No bodies. No sign of what burned it.",
    "The world thins here. Colors are wrong at the very edges of vision.",
    "You have not seen another living soul in three days.",
    "The stars are brighter here, and wrong.",
  ],
  lost_lands: [
    "Ancient stone paving persists through the overgrowth — this was a highway once.",
    "The stars here are wrong. Some are too bright. Some are new.",
    "A sound like a vast slow breath rises and falls from the ground itself.",
    "Something herded past here not long ago. The tracks are not any animal you know.",
    "Bones of things that should not exist, scattered and bleached clean.",
  ],
  hostile_tribal: [
    "Painted totems line the trail. A warning, or a marker for something else.",
    "Drums carry through the trees. They have been following you since dawn.",
    "An arrow lands in the earth three paces to your left. Then silence.",
    "A boundary stone painted in red ochre. The symbol means stay out.",
    "Eyes in the treeline. You count six. Then you stop counting.",
  ],
  thurania_hills: [
    "Rolling scrub hills. The wind carries the smell of wild thyme.",
    "Stone circles on the high ground. The shamans have not used this one recently.",
    "A Thuranian herdsman watches you pass from a distance. He does not wave.",
    "The road dips through a dry creek bed and climbs again into brown hills.",
    "Burial mounds dot the hillsides. Some are very old. Some are not.",
  ],
  grondar_plains: [
    "The iron smell of Grondar ore deposits drifts on the east wind.",
    "Open grassland, cropped short by massive cattle herds.",
    "A Grondar iron-train grinds past on wooden wheels — twenty carts, forty guards.",
    "Bones of large animals bleach in the sun. This was a battlefield not long ago.",
    "The wind carries sparks. Somewhere ahead, a forge is running.",
  ],
};

export function getFlavorText(zone: ZoneType): string {
  const pool = FLAVOR_POOLS[zone];
  if (!pool || pool.length === 0) return "The road continues.";
  return pool[Math.floor(Math.random() * pool.length)];
}

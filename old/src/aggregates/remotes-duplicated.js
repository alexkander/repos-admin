export default [
  {
    $group: {
      _id: {
        targetHost: "$targetHost",
        targetGroup: "$targetGroup",
        targetName: "$targetName",
      },
      count: {
        $sum: 1,
      },
      directories: {
        $push: "$directory",
      },
    },
  },
  {
    $match: {
      count: {
        $gt: 1,
      },
    },
  },
  {
    $project: {
      targetHost: "$_id.targetHost",
      targetGroup: "$_id.targetGroup",
      targetName: "$_id.targetName",
      count: 1,
      directories: 1,
    },
  },
];

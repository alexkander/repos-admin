export default [
  {
    $match: {
      fetchStatus: "error",
    },
  },
  {
    $group: {
      _id: {
        targetHost: "$targetHost",
        targetGroup: "$targetGroup",
      },
      count: {
        $sum: 1,
      },
      errors: {
        $push: {
          directory: "$directory",
          remote: "$name",
        },
      },
    },
  },
  {
    $project: {
      targetHost: "$_id.targetHost",
      targetGroup: "$_id.targetGroup",
      count: 1,
      errors: 1,
    },
  },
];

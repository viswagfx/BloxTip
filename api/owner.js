const { getUniverseDetails } = require("./_helpers");

module.exports = async function handler(req, res) {
  try {
    const universe = await getUniverseDetails();
    if (!universe) {
      return res.status(500).json({ error: "Could not fetch universe details" });
    }

    const creator = universe.creator;
    const { iconType } = req.query || {};
    
    let targetType = creator.type;
    let targetId = creator.id;
    let resolvedOwnerName = creator.name;
    let thumbnailUrl = null;

    // If game is owned by a group, but the user requested the owner's avatar
    if (creator.type === "Group" && (iconType === "owner" || iconType === "group-owner")) {
      try {
        const groupRes = await fetch(`https://groups.rotunnel.com/v1/groups/${creator.id}`);
        if (groupRes.ok) {
          const groupData = await groupRes.json();
          if (groupData && groupData.owner) {
            targetType = "User";
            targetId = groupData.owner.userId || groupData.owner.id;
            resolvedOwnerName = groupData.owner.username || groupData.owner.name;
          }
        }
      } catch (err) {
        console.warn("Could not fetch group owner details:", err);
      }
    }

    // Fetch the resolved thumbnail
    if (targetType === "Group") {
      const thumbRes = await fetch(`https://thumbnails.rotunnel.com/v1/groups/icons?groupIds=${targetId}&size=150x150&format=Png`);
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json();
        if (thumbData && thumbData.data && thumbData.data.length > 0) {
          thumbnailUrl = thumbData.data[0].imageUrl;
        }
      }
    } else {
      const thumbRes = await fetch(`https://thumbnails.rotunnel.com/v1/users/avatar-headshot?userIds=${targetId}&size=150x150&format=Png&isCircular=false`);
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json();
        if (thumbData && thumbData.data && thumbData.data.length > 0) {
          thumbnailUrl = thumbData.data[0].imageUrl;
        }
      }
    }

    // Cache on Vercel's global CDN Edge network for 1 hour, serve stale in background
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

    return res.json({
      name: creator.name,
      id: creator.id,
      type: creator.type,
      ownerName: resolvedOwnerName,
      ownerId: targetId,
      thumbnailUrl
    });
  } catch (err) {
    console.error("Error in owner handler:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

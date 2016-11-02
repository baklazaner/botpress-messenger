'use strict'

const Promise = require('bluebird');
const path = require('path');
const fs = require('fs');

module.exports = function(skin) {

  const filename = path.join(
    skin.dataLocation, 
    'skin-messenger.profiles.json'
    );

  const loadUserProfiles = () => {      
    if(fs.existsSync(filename)) {
      return JSON.parse(fs.readFileSync(filename));
    }
    return {}
  };

  const saveUserProfiles = (profiles) => {
    const content = JSON.stringify(profiles)
    fs.writeFileSync(filename, content)
    skin.logger.debug('messenger: saved user profiles to disk')
  };

  const userProfiles = loadUserProfiles();
  let cacheTs = new Date();

  return {
    getOrFetchUserProfile: Promise.method((userId) => {
      if(userProfiles[userId]) {
        return userProfiles[userId]
      }

      return messenger.getUserProfile(userId)
      .then((profile) => {
        profile.id = userId
        userProfiles[userId] = profile
        if (new Date() - cacheTs >= 10000) {
          saveUserProfiles(userProfiles)
          cacheTs = new Date()
        }
        return profile
      })
    })  
  }
};
// * Function do user search by email or userID
// */
const getUser = (userID, email, users) => {
 if (userID) {
   for (const user in users) {
     if (users[user].userID === userID) {
       return users[user];
     }
   }

   return null;
 }

 if (email) {
   for (const user in users) {
     if (users[user].email === email) {
       return users[user];
     }
   }

   return null;
 }
};


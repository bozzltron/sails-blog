var bcrypt = require("bcrypt");
if(process.argv[2]) {

	console.log("Hashing " + process.argv[2]);

    var bcrypt = require('bcrypt');

    bcrypt.genSalt(10, function(err, salt) {
      if (err) console.log(err);

      bcrypt.hash(process.argv[2], salt, function(err, hash) {
        if (err) console.log(err);

        console.log(hash);
      });
    });
} else {
	console.log("pass a password, i.e. node make-password.js <your password>");
}
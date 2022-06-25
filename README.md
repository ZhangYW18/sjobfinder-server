# Job Finder - Client

This is the backend part of this app, frontend part of this app is [here](https://github.com/ZhangYW18/sjobfinder-client).

This app is based on Express.js & MongoDB.

## How to run

Before running this project, install MongoDB first.

Then replace the connection url with your own in line 3 of `db/models.js` in this project:

```javascript
mongoose.connect('mongodb://username:password@localhost:27017/sjobfinder?authMechanism=DEFAULT&authSource=admin')
```

Then run it using `npm`:

```shell
npm start
```


REST API Documentation
==========

### Users

#### Single User

Get a single user.

```
GET api/users/:edxid
```

Parameters:

- edxid (required) - The ID of user in Open edX

Response:

```
{
  "result":true,
  "user":
  {
    "edx_id":"12345",
    "email":"xxxxx@xxxxx.xxx",
    "git_id":32,
    "git_token":"xxxxxxxxxxxxxxxx",
    "ucore_lab":"git@githost:gituser/gitproject.git",
    "name":"xxxxx",
    "password":"xxxxxxxxx",
    "private_key":"-----BEGIN RSA PRIVATE KEY-----\nxxxxxxxxxxxxxxxxxxxx\n-----END RSA PRIVATE KEY-----\n",
    "public_key":"ssh-rsa x/x+x+Kv7F98ARmfqTPOG36TfGZ/x+x/x xxxxx@xxx.xxx\n"
  }
}
```
  ,or
```
{
  "result":false,
  "message":"user id does not exist"
}
```

#### User creation

Create a new user.

```
POST api/users
```

Parameters:

- email (required) - Email
- username (required) - Username
- edxid (required) - The ID of user in Open edX

Response:

```
{
  "result":true,
  "user":
  {
    "edx_id":"12345",
    "email":"xxxxx@xxxxx.xxx",
    "git_id":32,
    "git_token":"xxxxxxxxxxxxxxxx",
    "name":"xxxxx",
    "password":"xxxxxxxxx",
    "private_key":"-----BEGIN RSA PRIVATE KEY-----\nxxxxxxxxxxxxxxxxxxxx\n-----END RSA PRIVATE KEY-----\n",
    "public_key":"ssh-rsa x/x+x+Kv7F98ARmfqTPOG36TfGZ/x+x/x xxxxx@xxx.xxx\n"
  }
}
```
  ,or
```
{
  "result":false,
  "message":"email has been used"
}
```

#### User deletion

Delete a user.

```
DELETE /users/:id
```

Parameters:

- edxid (required) - The ID of user in Open edX

Response:

```
{
  "result":true,
}
```
  ,or
```
{
  "result":false,
}
```

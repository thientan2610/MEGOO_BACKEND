# inv member

## Summary

Invitte list of members by their email to join `group`.

The `jwt` token was sent to the email can use by any logged account. **The email owner must protect their token**

## Invite member

### Request

`POST`

body

```json
{
  "grId": "6471ae20dfa917ff886ba3da",
  "emails": ["minhthoai1250@gmail.com", "nmphat01062001@gmail.com"],
  "feUrl": "http://phatttt:8080/pgk-mgmt/gr/join"
}
```

### Response

Some time We got the troubles with the `email server`. So some emails can not be sent token to, they will be return in the response.

```json
{
  "statusCode": 200,
  "message": "Generate join group token successfully",
  "data": {
    "emailsFailed": ["nmphat01062001@gmail.com"]
  }
}
```

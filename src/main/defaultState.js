const state = {
  "Projects": [],
  "Settings": {
    "projectDir": process.platform === 'win32' ? "%HOMEPATH%\\Projects" : "~/Projects",
    "deployBaseUrl": null,
    "deployType": 's3',
    "awsBucket": null,
    "awsPrefix": null,
    "awsRegion": 'us-east-1',
    "awsAccessKeyId": null,
    "awsSecretAccessKey": null
  }
}

if (process.env.NODE_ENV === 'development')
  state.Projects = [
    {
      "id": 1,
      "title": "My project",
      "path": "/Users/ryanmark/Projects/my-project",
      "status": "new",
      "deployedDate": null,
      "errorMessage": null,
      "focus": false
    },
    {
      "id": 2,
      "title": "Deploying project",
      "path": "~/Projects/deploying-project",
      "status": "deploying",
      "deployedDate": null,
      "errorMessage": null,
      "focus": false
    },
    {
      "id": 3,
      "title": "Finished project",
      "path": "~/Projects/finished-project",
      "status": "deployed",
      "deployedDate": "Today at 2:03pm",
      "errorMessage": null,
      "focus": false
    },
    {
      "id": 4,
      "title": "My project",
      "path": "~/Projects/my-project",
      "status": "error",
      "deployedDate": null,
      "errorMessage": "Failed to deploy to Autotune!",
      "focus": false
    },
    {
      "id": 5,
      "title": "Deploying project",
      "path": "~/Projects/deploying-project",
      "status": "deploying",
      "deployedDate": null,
      "errorMessage": null,
      "focus": false
    },
    {
      "id": 6,
      "title": "Finished project",
      "path": "~/Projects/finished-project",
      "status": "error",
      "deployedDate": "Today at 2:03pm",
      "errorMessage": "Can't find project on disk!",
      "focus": false
    },
    {
      "id": 7,
      "title": "My project",
      "path": "~/Projects/my-project",
      "status": "new",
      "deployedDate": null,
      "errorMessage": null,
      "focus": false
    },
    {
      "id": 8,
      "title": "Deploying project",
      "path": "~/Projects/deploying-project",
      "status": "deploying",
      "deployedDate": null,
      "errorMessage": null,
      "focus": false
    },
    {
      "id": 9,
      "title": "Finished project",
      "path": "~/Projects/finished-project",
      "status": "deployed",
      "deployedDate": "Today at 2:03pm",
      "errorMessage": null,
      "focus": false
    }
  ]

export default state

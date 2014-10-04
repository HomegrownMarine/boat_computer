{
    "boatName": "Project Mayhem",

    "settingsFile": "/race/data/settings.json",
    
    "disabledApps": ["tacktick", "goto", "calcs"],

    "winston:logLevel": "info",
    "winston:logDir": "/race/data/logs/",
    
    "logs:dataDir": "/race/data/raw/",
    
    "dataSources": [
        {
            "name": "Compass",
            "path": "/dev/ttyO2",
            "driver": "H2183CompassInput"
        },
        {
            "name": "Tacktick",
            "path": "/dev/ttyO1",
            "baud": 4800,
            "rateLimit": 1000,
            "whitelist": ["IIMWV","IIVHW","IIVLW","IIVWR","IIMTW","GPRMC","HCHDG","PTAK","IIRMB"]
        },
        {
            "name": "GPS",
            "path": "/dev/ttyO4",
            "baud": 38400,
            "write": false
        }
    ],
    
    "exampleSources": [
        {
            "name": "gps2",
            "path": "/dev/ttyO4",
            "baud": 9600,
            "write": false
        },
        {
            "name": "adafruit gps",
            "path": "/dev/ttyO4",
            "driver": "mtk3339GPSInput"
        }
    ],

    "production": {
        "port": 80,
        "syncSystemTime": true
    },
    "development": {
         "port": 3000,
         "dataSources": [{
            "name": "replay",
            "driver": "replayInput",
            "file": "/race/data/raw/14030812.txt"
        }],
        "disabledApps": [],
        "logs:log": false
    }
}



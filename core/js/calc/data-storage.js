(function() {
  window.calconic = {
    status: 200,
    calculator: {
      "_id": "66893a6908dd93002b625b77",
      "settings": {
        "sites": [],
        "showName": true,
        "decimalSeparator": ".",
        "thousandsSeparator": ".",
        "name": "V.Ar Production",
        "timezone": "Europe/Moscow"
      },
      "shopify": {
        "products": []
      },
      "embeddedLinkData": {
        "link": "https://www.calconic.com/calculator-widgets/price-quote-calculator",
        "title": "Instant Price Quote Calculator"
      },
      "active": true,
      "advanced": "",
      "elements": [
        {
          "ref": "#1",
          "elementType": "select",
          "descriptor": "Select Field",
          "settings": {
            "options": [
              {
                "value": 400,
                "label": "Интерьер",
                "ref": "o1",
                "elementType": "option"
              },
              {
                "label": "Интерьер офиса",
                "value": 300,
                "ref": "o5",
                "elementType": "option"
              },
              {
                "label": "Экстерьер дома",
                "value": 300,
                "ref": "o6",
                "elementType": "option"
              },
              {
                "label": "Жилой Комплекс",
                "value": 15,
                "ref": "o9",
                "elementType": "option"
              }
            ],
            "defaultValue": 0,
            "desiredHeight": {
              "lg": 74,
              "sm": 74,
              "md": 62
            }
          },
          "advancedSettings": {
            "visibility": {
              "active": false,
              "defaultValue": 0,
              "compiledRule": "",
              "ruleset": []
            }
          },
          "label": "Тип",
          "hint": "",
          "showLabel": true,
          "showElement": true,
          "style": {
            "elementBackgroundColor": {
              "active": false,
              "value": "#ffffff"
            },
            "label": {
              "active": false,
              "value": {
                "weight": "bold",
                "font": "'Open Sans', sans-serif",
                "size": 13,
                "color": "#000000"
              }
            },
            "paddingLeft": {
              "active": false,
              "value": 20
            },
            "paddingRight": {
              "active": false,
              "value": 20
            },
            "paddingTop": {
              "active": false,
              "value": 20
            },
            "paddingBottom": {
              "active": false,
              "value": 20
            },
            "backgroundColor": {
              "active": false,
              "value": "#ebebeb"
            },
            "backgroundColor2": {
              "active": false,
              "value": "#000000"
            },
            "fieldText": {
              "active": false,
              "value": {
                "weight": "normal",
                "font": "'Open Sans', sans-serif",
                "size": 12,
                "color": "#000000"
              }
            },
            "borderSize": {
              "active": false,
              "value": 2
            },
            "borderRadius": {
              "active": false,
              "value": 0
            },
            "borderColor": {
              "active": false,
              "value": "#ebebeb"
            }
          },
          "extendedStyle": {
            "sm": {
              "elementBackgroundColor": {
                "active": false,
                "value": "#ffffff"
              },
              "label": {
                "active": false,
                "value": {
                  "weight": "bold",
                  "font": "'Open Sans', sans-serif",
                  "size": 13,
                  "color": "#000000"
                }
              },
              "paddingLeft": {
                "active": false,
                "value": 20
              },
              "paddingRight": {
                "active": false,
                "value": 20
              },
              "paddingTop": {
                "active": false,
                "value": 20
              },
              "paddingBottom": {
                "active": false,
                "value": 20
              },
              "backgroundColor": {
                "active": false,
                "value": "#ebebeb"
              },
              "backgroundColor2": {
                "active": false,
                "value": "#000000"
              },
              "fieldText": {
                "active": false,
                "value": {
                  "weight": "normal",
                  "font": "'Open Sans', sans-serif",
                  "size": 12,
                  "color": "#000000"
                }
              },
              "borderSize": {
                "active": false,
                "value": 2
              },
              "borderRadius": {
                "active": false,
                "value": 0
              },
              "borderColor": {
                "active": false,
                "value": "#ebebeb"
              }
            }
          },
          "logic": {
            "actions": []
          },
          "permissions": {
            "all": true
          },
          "additionalStyles": "",
          "elementId": "el_1"
        }
      ]
    },
    data: {
      "el_1": 0
    }
  };

  window.calconic.init = function() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/calconic@0.1.27/dist/calconic.min.js';
    script.async = true;
    script.setAttribute('data-storage', 'calculator-storage');
    document.head.appendChild(script);
  };

  window.calconic.destroy = function() {
    const self = document.querySelector('[data-storage="calculator-storage"]');
    if (self) {
      self.remove();
    }
  };

  window.calconic.init();
})();
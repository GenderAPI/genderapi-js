(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.GenderAPI = factory());
})(this, (function () { 'use strict';

    class GenderAPI {
        constructor(apiKey, baseUrl = "https://api.genderapi.io") {
            this.apiKey = apiKey;
            this.baseUrl = baseUrl;
        }

        async getGenderByName({name, country = null, askToAI = false, forceToGenderize = false}) {
            if(typeof name !== "string" || !name.trim()) {
                return {status:false,errno: 91, errmsg: "Missing name parameter on your request."};
            }

            return await this._postRequest("/api", {
                name,
                country,
                askToAI,
                forceToGenderize
            });
        }

        async getGenderByEmail(email, country = null, askToAI = false) {
            if(typeof email !== "string" || !email.trim()) {
                return {status:false,errno: 91, errmsg: "Missing email parameter on your request."};
            }
            return await this._postRequest("/api/email", {
                email,
                country,
                askToAI
            });
        }

        async getGenderByUsername(username, country = null, askToAI = false, forceToGenderize = false) {
            if (typeof username !== "string" || !username.trim()) {
                return {status:false,errno: 91, errmsg: "Missing username parameter on your request."};
            }
            return await this._postRequest("/api/username", {
                username,
                country,
                askToAI,
                forceToGenderize
            });
        }

        async _postRequest(endpoint, payload) {
            const url = `${this.baseUrl}${endpoint}`;
            const headers = {
                "Authorization": `Bearer ${this.apiKey}`,
                "Content-Type": "application/json"
            };

            const body = JSON.stringify(
                Object.fromEntries(
                    Object.entries(payload).filter(([_, v]) => v !== null)
                )
            );

            const response = await fetch(url, {
                method: "POST",
                headers,
                body
            });

            if (response.status === 500) {
                throw new Error(`Server Error: ${response.statusText}`);
            }

            if (response.status !== 200) {
                const errorJson = await response.json().catch(() => null);
                if (errorJson) {
                    throw new Error(`API Error ${response.status}: ${JSON.stringify(errorJson)}`);
                } else {
                    throw new Error(`API Error ${response.status}: ${response.statusText}`);
                }
            }

            return await response.json();
        }
    }

    // CommonJS Export
    if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
        module.exports = GenderAPI;
    }

    return GenderAPI;

}));

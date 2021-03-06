/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership. Camunda licenses this file to you under the Apache License,
 * Version 2.0; you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from "react";
import { withRouter } from "react-router-dom";

import { post } from "utils/request";
import translate from "utils/translation";
import pathUtil from "utils/paths";

import { Dropdown } from "components";

import "./UserInformation.scss";
import SmallScreenSwitch from "./SmallScreenSwitch";
import { addMessage } from "utils/notifications";

function UserInformation({ user, history }) {
  const profile = user.profile;

  function logout() {
    post("%ADMIN_API%/auth/user/%ENGINE%/logout").then(() => {
      history.push("/login");
      var getDayContext = function() {
        var now = new Date();
        if (now.getDay() >= 5) {
          return "AUTH_DAY_CONTEXT_WEEKEND";
        } else {
          var hour = now.getHours();
          switch (true) {
            case hour >= 4 && hour < 7:
              return "AUTH_DAY_CONTEXT_MORNING";
            case hour >= 7 && hour < 12:
              return "AUTH_DAY_CONTEXT_DAY";
            case hour >= 12 && hour < 17:
              return "AUTH_DAY_CONTEXT_AFTERNOON";
            case hour >= 17 && hour < 22:
              return "AUTH_DAY_CONTEXT_EVENING";
            case hour >= 22 || hour < 4:
              return "AUTH_DAY_CONTEXT_NIGHT";
            default:
              // should never get here, but just to be sure
              return "AUTH_DAY_CONTEXT_DAY";
          }
        }
      };

      addMessage({
        status: translate("AUTH_LOGOUT_SUCCESSFUL"),
        message: translate("AUTH_LOGOUT_THANKS", {
          dayContext: translate(getDayContext())
        }),
        exclusive: true
      });
    });
  }

  return (
    <div className="UserInformation">
      <Dropdown
        title={
          <button className="user">
            <span className="glyphicon glyphicon-user" />
            <SmallScreenSwitch>
              <span className="userName">
                {profile
                  ? `${profile.firstName} ${profile.lastName}`
                  : user.userId}
              </span>
            </SmallScreenSwitch>
          </button>
        }
        position="right"
      >
        <Dropdown.Option>
          <a href={`../../welcome/${pathUtil("engine")}/`}>
            {translate("MY_PROFILE")}
          </a>
        </Dropdown.Option>
        <Dropdown.Divider />
        <Dropdown.Option onClick={logout}>
          {translate("SIGN_OUT_ACTION")}
        </Dropdown.Option>
      </Dropdown>
    </div>
  );
}

export default withRouter(UserInformation);

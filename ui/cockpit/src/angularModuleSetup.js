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

import camCommonsModule from "./legacy/camunda-commons-ui/lib";
import pluginsModule from "./legacy/plugins";
import services from "./legacy/client/scripts/services/main";
import resources from "./legacy/client/scripts/resources/main";
import filters from "./legacy/client/scripts/filters/main";
import directives from "./legacy/client/scripts/directives/main";
import eePlugins from "./enterprise/cockpit/cockpitPluginsEE";

import getPassthroughData from "utils/angularToReactPluginInterface";

import $ from "jquery";

import dataDepend from "angular-data-depend/src/dataDepend";
import { getPlugins, getConfig, getLocale } from "utils/config";

export default function setup(module) {
  const config = getConfig();
  const locale = getLocale().labels;
  const plugins = getPlugins();

  module.requires.push(
    camCommonsModule.name,
    dataDepend.name,
    pluginsModule.name,
    services.name,
    resources.name,
    filters.name,
    directives.name,
    eePlugins.name
  );

  plugins.forEach(plugin => {
    const pluginDirectiveUID = Math.random()
      .toString(36)
      .substring(2);

    // overlay function for diagram overlay plugins
    plugin.overlay = [
      "control",
      "$scope",
      ({ getViewer }, scope) => {
        plugin.render(
          getViewer(),
          getPassthroughData(plugin.pluginPoint, scope),
          scope
        );
        scope.$on("$destroy", plugin.cleanup);
      }
    ];

    module.directive("pluginBridge" + pluginDirectiveUID, [
      function() {
        return {
          link: function(scope, element) {
            const isolatedContainer = document.createElement("div");
            plugin.render(
              isolatedContainer,
              getPassthroughData(plugin.pluginPoint, scope),
              scope
            );

            element[0].appendChild(isolatedContainer);
            scope.$on("$destroy", plugin.cleanup);
          }
        };
      }
    ]);

    module.config([
      "$httpProvider",
      function($httpProvider) {
        $httpProvider.defaults.xsrfCookieName = config.csrfCookieName;
      }
    ]);

    module.config([
      "ViewsProvider",
      function(ViewsProvider) {
        ViewsProvider.registerDefaultView(plugin.pluginPoint, {
          ...plugin,
          template: `<div plugin-bridge${pluginDirectiveUID} />`
        });
      }
    ]);
  });

  module.provider(
    "configuration",
    require("./legacy/common/scripts/services/cam-configuration")(
      config,
      "Cockpit"
    )
  );

  module.config([
    "$translateProvider",
    function($translateProvider) {
      // add translation table
      $translateProvider.translations("en", locale).preferredLanguage("en");
      $translateProvider.useSanitizeValueStrategy("escapeParameters");
    }
  ]);

  module.config([
    "$routeProvider",
    "UriProvider",
    "$uibModalProvider",
    "$uibTooltipProvider",
    "$locationProvider",
    "$animateProvider",
    "$qProvider",
    function(
      $routeProvider,
      UriProvider,
      $modalProvider,
      $tooltipProvider,
      $locationProvider,
      $animateProvider,
      $qProvider
    ) {
      UriProvider.replace(":appName", "cockpit");
      UriProvider.replace("app://", getUri("href"));
      UriProvider.replace("adminbase://", getUri("app-root") + "/app/admin/");
      UriProvider.replace(
        "tasklistbase://",
        getUri("app-root") + "/app/tasklist/"
      );
      UriProvider.replace("cockpit://", getUri("cockpit-api"));
      UriProvider.replace(
        "admin://",
        getUri("admin-api") || getUri("cockpit-api") + "../admin/"
      );
      UriProvider.replace("plugin://", getUri("cockpit-api") + "plugin/");
      UriProvider.replace("engine://", getUri("engine-api"));

      UriProvider.replace(":engine", [
        "$window",
        function($window) {
          var uri = $window.location.href;

          var match = uri.match(/\/app\/cockpit\/([\w-]+)(|\/)/);
          if (match) {
            return match[1];
          } else {
            throw new Error("no process engine selected");
          }
        }
      ]);

      $modalProvider.options = {
        animation: true,
        backdrop: true,
        keyboard: true
      };

      $tooltipProvider.options({
        animation: true,
        popupDelay: 100,
        appendToBody: true
      });

      $locationProvider.hashPrefix("");

      $animateProvider.classNameFilter(/angular-animate/);

      $qProvider.errorOnUnhandledRejections(true);
    }
  ]);
}

function getUri(id) {
  var uri = $("base").attr(id);
  if (!id) {
    throw new Error("Uri base for " + id + " could not be resolved");
  }

  return uri;
}

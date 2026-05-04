<?php


/**
 * MarketSpace — Front Controller
 *
 * All requests are routed through this file via web server rewrite rules.
 */

require_once __DIR__ . '/../vendor/autoload.php';

use MarketSpace\Core\Request;
use MarketSpace\Core\Response;
use MarketSpace\Core\Router;

// Handle CORS preflight
Response::handleCors();

// Boot
$request = new Request();
$router  = new Router();

// Load route definitions
require_once __DIR__ . '/../src/routes.php';

// Dispatch
$router->dispatch($request);

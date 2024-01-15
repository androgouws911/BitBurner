// services.js
export const Services = {
    Startup: "scripts/services/startup.js",
    EarlyHack:"scripts/services/early_game_hack.js",
    Manager: "scripts/services/main_manager.js",
    HackHandler: "scripts/services/hack_port_handler.js",
    HWGW: "scripts/services/hwgw_service.js",
    WGW : "scripts/services/wgw_service.js",
    PrepHackServers: "scripts/services/prepare_hacked_servers_service.js",
    KillHome: "scripts/services/kill_home_service.js",
    KillServers: "scripts/services/kill_servers_service.js",
    Contract: "scripts/services/contract_service.js",
    HackNet: "scripts/services/hack_net.js",
    PurchaseServer: "scripts/services/purchased_server_service.js",
    UpgradeServer: "scripts/services/upgrade_server_service.js",
};

// handlers.js
export const Handler = {
    GetAllData: "scripts/handler/get_all_data.js",
    GetDynamicData: "scripts/handler/get_dynamic_data.js",
    GetStaticData: "scripts/handler/get_static_data.js",
    ContractReader: "scripts/handler/contract_reader.js",
    ContractSolver: "scripts/handler/contract_solver.js",
    ContractPortHandler: "scripts/handler/contract_port.js",
    ContractAnswer: "scripts/handler/submit_answer.js",
    General: "scripts/handler/general_handler.js"
};

// data.js
export const Data = {
    All: "scripts/data/all_server_names_list.txt",
    Dynamic: "scripts/data/dynamic_server_data.txt",
    Static: "scripts/data/static_server_data.txt",
    FileList: 'scripts/data/file_list_model.js',
    ShouldKill: 'scripts/data/kill_hwgw.txt'
};

// actions.js
export const Action = {
    Hack: "scripts/actions/hack.js",
    Grow: "scripts/actions/grow.js",
    Weak: "scripts/actions/weak.js",
    Root: "scripts/actions/root.js",
    Copy: "scripts/actions/copy.js",
    EarlyHack: "scripts/actions/early_hack.js",
};
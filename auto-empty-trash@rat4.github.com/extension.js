const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

let trash_directory;
let event;

let delete_after = 7 * 24 * 60 * 60;
let check_interval = 12 * 60 * 60;

function init() {
    trash_directory = Gio.file_new_for_uri('trash:///');
}

function enable() {
    tick(); //first check immediately after activation
    event = GLib.timeout_add_seconds(0, check_interval, tick, null, null);
}

function disable() {
    GLib.source_remove(event);
}

function tick() {
    doEmptyTrash();
    return true;
}

function doEmptyTrash() {
    if (!trash_directory.query_exists(null))
        return;

    let current_time = get_current_time();

    const attributes = Gio.FILE_ATTRIBUTE_STANDARD_NAME + ',' + Gio.FILE_ATTRIBUTE_TRASH_DELETION_DATE;
    let children = trash_directory.enumerate_children(attributes, 0, null, null);
    let child_info;

    while ((child_info = children.next_file(null, null)) != null) {
        let deletion_time = child_info.get_attribute_string(Gio.FILE_ATTRIBUTE_TRASH_DELETION_DATE);
        let time = get_time_from_string(deletion_time);

        if (current_time.tv_sec - time.tv_sec < delete_after)
            continue;

        delete_file(child_info);
    }
}

function get_current_time() {
    let time = new GLib.TimeVal();
    GLib.get_current_time(time);
    return time;
}

function get_time_from_string(string) {
    let time = new GLib.TimeVal();
    GLib.time_val_from_iso8601(string, time);
    return time;
}

function delete_file(file_info) {
    let name = file_info.get_name();
    let child = trash_directory.get_child(name);
    child.delete(null);
}

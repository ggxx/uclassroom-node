'use strict';

$("#createFlatWindow").on('click', function () {
    $.Dialog({
        overlay: true,
        shadow: true,
        flat: true,
        draggable: true,
        icon: '<img src="images/excel2013icon.png">',
        title: 'Flat window',
        content: '',
        padding: 10,
        onShow: function (_dialog) {
            var content = '<form class="user-input">' +
                '<label>Login</label>' +
                '<div class="input-control text"><input type="text" name="login"><button class="btn-clear"></button></div>' +
                '<label>Password</label>' +
                '<div class="input-control password"><input type="password" name="password"><button class="btn-reveal"></button></div>' +
                '<div class="input-control checkbox"><label><input type="checkbox" name="c1" checked/><span class="check"></span>Check me out</label></div>' +
                '<div class="form-actions">' +
                '<button class="button primary">Login to...</button>&nbsp;' +
                '<button class="button" type="button" onclick="$.Dialog.close()">Cancel</button> ' +
                '</div>' +
                '</form>';
            $.Dialog.title("User login");
            $.Dialog.content(content);
        }
    });
});
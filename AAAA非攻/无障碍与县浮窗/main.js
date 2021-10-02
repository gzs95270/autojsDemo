"ui";
ui.layout(
    <vertical>
        <appbar>
            <toolbar title="聚合刷房1.0.1" />
        </appbar>
        <Switch id="autoService" text="无障碍服务" checked="{{auto.service != null}}" padding="8 8 8 8" textSize="15sp" />
        <Switch id="windowService" text="悬浮窗服务" checked="{{floaty.checkPermission()}}" padding="8 8 8 8" textSize="15sp" />
        <button id="start" text="开始运行" />
    </vertical>
);

ui.autoService.on("check", function (checked) {
    // 用户勾选无障碍服务的选项时，跳转到页面让用户去开启
    if (checked && auto.service == null) {
        app.startActivity({
            action: "android.settings.ACCESSIBILITY_SETTINGS"
        });
    }
    if (!checked && auto.service != null) {
        auto.service.disableSelf();
    }
});
ui.windowService.on('check', (checked) => {
    // 用户勾选悬浮窗权限的选项时，跳转到页面让用户去开启
    app.startActivity({
        packageName: "com.android.settings",
        className: "com.android.settings.Settings$AppDrawOverlaySettingsActivity",
        data: "package:" + currentPackage()		//当前活动，可以写成固定的
    });
    ui.emitter.on("resume", function () {
        // 此时根据无障碍服务的开启情况，同步开关的状态
        ui.autoService.checked = auto.service != null;
        // ui.windowService.checked = floaty.checkPermission();
    });

});

ui.start.on("click", function () {
    //程序开始运行之前判断无障碍服务
    if (auto.service == null) {
        toast("请先开启无障碍服务！");
        return;
    }
    main();
});

function main() {
    // 这里写脚本的主逻辑
    threads.start(function () {
        /**
         * 开启悬浮窗
         */
        try {
            var window = floaty.window(
                <frame>
                    <button id="action" text="停止运行" w="auto" h="auto" bg="#FF8C00" />
                </frame>
            );
            setInterval(() => { }, 1000);
            var execution = null;
            //记录按键被按下时的触摸坐标
            var x = 0,
                y = 0;
            //记录按键被按下时的悬浮窗位置
            var windowX, windowY;
            //记录按键被按下的时间以便判断长按等动作
            var downTime;
            window.action.setOnTouchListener(function (view, event) {
                switch (event.getAction()) {
                    case event.ACTION_DOWN:
                        x = event.getRawX();
                        y = event.getRawY();
                        windowX = window.getX();
                        windowY = window.getY();
                        downTime = new Date().getTime();
                        return true;
                    case event.ACTION_MOVE:
                        //移动手指时调整悬浮窗位置
                        window.setPosition(windowX + (event.getRawX() - x),
                            windowY + (event.getRawY() - y));
                        //如果按下的时间超过3秒判断为长按，退出脚本
                        if (new Date().getTime() - downTime > 3000) {
                            exit();
                        }
                        return true;
                    case event.ACTION_UP:
                        //手指弹起时如果偏移很小则判断为点击
                        if (Math.abs(event.getRawY() - y) < 5 && Math.abs(event.getRawX() - x) < 5) {
                            onClick();
                        }
                        return true;
                }
                return true;
            });
            function onClick() {
                if (window.action.getText() == '停止运行') {
                    ui.run(function () {
                        window.action.setText('不用拉倒，呸！');
                    });
                    setTimeout(exit, 3000);
                }
            }
        } catch (e) { }
    });
}

import Cocoa
import WebKit

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    var window: NSWindow!
    var web: WKWebView!
    var testReport: String? { if let i=CommandLine.arguments.firstIndex(of:"--test-report"), i+1<CommandLine.arguments.count { return CommandLine.arguments[i+1] };return nil }
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        let menu=NSMenu();let item=NSMenuItem();menu.addItem(item);let sub=NSMenu();sub.addItem(withTitle:"О Raid Atlas",action:#selector(NSApplication.orderFrontStandardAboutPanel(_:)),keyEquivalent:"");sub.addItem(.separator());sub.addItem(withTitle:"Выйти из Raid Atlas",action:#selector(NSApplication.terminate(_:)),keyEquivalent:"q");item.submenu=sub
        let edit=NSMenuItem();edit.title="Правка";menu.addItem(edit);let em=NSMenu(title:"Правка");for (t,a,k) in [("Копировать","copy:","c"),("Вставить","paste:","v"),("Вырезать","cut:","x"),("Выбрать всё","selectAll:","a")]{em.addItem(withTitle:t,action:Selector(a),keyEquivalent:k)};edit.submenu=em;NSApp.mainMenu=menu
        let config=WKWebViewConfiguration();config.preferences.javaScriptCanOpenWindowsAutomatically=false
        if testReport != nil { config.websiteDataStore = .nonPersistent() }
        web=WKWebView(frame:.zero,configuration:config);web.navigationDelegate=self;web.setValue(false,forKey:"drawsBackground")
        window=NSWindow(contentRect:NSRect(x:0,y:0,width:CommandLine.arguments.contains("--small") ? 1050 : 1380,height:CommandLine.arguments.contains("--small") ? 700 : 900),styleMask:[.titled,.closable,.miniaturizable,.resizable],backing:.buffered,defer:false);window.title="Raid Atlas \(Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "") — PvE";window.minSize=NSSize(width:1050,height:700);window.backgroundColor=NSColor(red:0.07,green:0.10,blue:0.08,alpha:1);window.contentView=web;window.center();window.makeKeyAndOrderFront(nil);NSApp.activate(ignoringOtherApps:true)
        let root=Bundle.main.resourceURL!.appendingPathComponent("web",isDirectory:true)
        web.loadFileURL(root.appendingPathComponent("index.html"),allowingReadAccessTo:root)
    }
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy)->Void) {
        if let url=action.request.url, ["https","http"].contains(url.scheme ?? "") { if action.navigationType == .linkActivated {NSWorkspace.shared.open(url)}; decisionHandler(.cancel) } else {decisionHandler(.allow)}
    }
    func webView(_ webView:WKWebView,didFinish navigation:WKNavigation!){
        guard let path=testReport else{if CommandLine.arguments.contains("--show-upper-floor"){web.evaluateJavaScript("changeMap(\"customs\");setView(true);document.getElementById(\"floor\").value=3;document.getElementById(\"floor\").dispatchEvent(new Event(\"change\"));",completionHandler:nil);return};if CommandLine.arguments.contains("--show-reserve"){web.evaluateJavaScript("changeMap(\"reserve\");setView(true);tab(\"route\");",completionHandler:nil);return};if CommandLine.arguments.contains("--show-route"){web.callAsyncJavaScript("changeMap('customs');tab('route');setView(true);if(state.starts.customs && state.exit.customs!==undefined && state.exit.customs!==''){await plan();setView(true);}",arguments:[:],in:nil,in:.page){_ in };return};if CommandLine.arguments.contains("--show-customs"){web.evaluateJavaScript("changeMap(\"customs\");setView(true);tab(\"exits\");",completionHandler:nil)};if CommandLine.arguments.contains("--show-factory"){web.evaluateJavaScript("changeMap(\"factory\");setView(true);tab(\"tasks\");",completionHandler:nil)};return}
        DispatchQueue.main.asyncAfter(deadline:.now()+0.5){
            self.web.callAsyncJavaScript(CommandLine.arguments.contains("--test-exit-audit") ? "return await window.runExitAudit();" : CommandLine.arguments.contains("--test-exit-corrections") ? "return await window.runExitCorrections();" : CommandLine.arguments.contains("--test-exit-levels") ? "return await window.runExitLevels();" : CommandLine.arguments.contains("--test-exit-highlight") ? "return await window.runExitHighlight();" : CommandLine.arguments.contains("--test-exit-filter") ? "return await window.runExitFilter();" : CommandLine.arguments.contains("--test-scav-exits") ? "return await window.runScavExits();" : CommandLine.arguments.contains("--test-floor-quality") ? "return await window.runFloorQuality();" : CommandLine.arguments.contains("--test-place-search") ? "return await window.runPlaceSearch();" : CommandLine.arguments.contains("--test-auto-exits") ? "return await window.runAutoExits();" : CommandLine.arguments.contains("--test-label-coverage") ? "return await window.runLabelCoverage();" : CommandLine.arguments.contains("--test-room-labels") ? "return await window.runRoomLabels(scenario);" : CommandLine.arguments.contains("--preview-upper-floor") ? "return await window.previewUpperFloor(scenario);" : CommandLine.arguments.contains("--test-ground-upper") ? "return await window.runGroundUpperRoute();" : CommandLine.arguments.contains("--test-floor-plans") ? "return await window.runAllFloorPlans();" : CommandLine.arguments.contains("--test-underground-view") ? "return await window.runUndergroundView(scenario);" : CommandLine.arguments.contains("--test-factory-exits") ? "return await window.runFactoryExits();" : CommandLine.arguments.contains("--test-basements") ? "return await window.runBasementRoutes(scenario);" : CommandLine.arguments.contains("--research-details") ? "return await window.researchPortalDetails();" : CommandLine.arguments.contains("--audit-transitions") ? "return await window.auditTransitions(scenario);" : CommandLine.arguments.contains("--research-upper") ? "return await window.researchUpper();" : CommandLine.arguments.contains("--research-portals") ? "return await window.researchPortals(scenario);" : CommandLine.arguments.contains("--test-floors") ? "return await window.runInterchangeFloors();" : CommandLine.arguments.contains("--test-routes") ? "return await window.runExpandedRoutes();" : CommandLine.arguments.contains("--test-expanded") ? "return await window.runExpandedScan();" : CommandLine.arguments.contains("--test-shell") ? "return await window.runShellManualSmoke();" : CommandLine.arguments.contains("--test-overlay") ? "return await window.runOverlaySmoke(scenario,displayStyle);" : CommandLine.arguments.contains("--test-flare") ? "return await window.runFlareRoute();" : CommandLine.arguments.contains("--research") ? "return await window.runMapResearch(displayStyle);" : CommandLine.arguments.contains("--test-gallery") ? "return await window.runGallerySmoke();" : CommandLine.arguments.contains("--test-atlas") ? "return await window.runAtlasSmoke();" : CommandLine.arguments.contains("--test-3d") ? "return await window.runFactory3DSmoke();" : CommandLine.arguments.contains("--test-ui") ? "return await window.runUISmoke(scenario,displayStyle);" : "return await window.runSmoke(scenario);",arguments:["scenario":CommandLine.arguments.contains("--customs") ? "customs" : "factory","displayStyle":CommandLine.arguments.contains("--realistic") ? "realistic" : "classic"],in:nil,in:.page){ result in
                let payload: [String:Any]
                switch result{case .success(let value):payload=["ok":true,"result":value];case .failure(let error):payload=["ok":false,"error":error.localizedDescription,"details":String(describing:(error as NSError).userInfo)]}
                if let data=try? JSONSerialization.data(withJSONObject:payload,options:[.prettyPrinted,.sortedKeys]) {try? data.write(to:URL(fileURLWithPath:path))}
                let snapshot=WKSnapshotConfiguration();snapshot.rect=self.web.bounds
                self.web.takeSnapshot(with:snapshot){image,error in
                    if let tiff=image?.tiffRepresentation,let rep=NSBitmapImageRep(data:tiff),let data=rep.representation(using:.png,properties:[:]){try? data.write(to:URL(fileURLWithPath:path+".png"))}
                    NSApp.terminate(nil)
                }
            }
        }
    }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender:NSApplication)->Bool{true}
}
let app=NSApplication.shared
let delegate=AppDelegate()
app.delegate=delegate
app.run()

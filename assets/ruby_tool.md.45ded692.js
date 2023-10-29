import{_ as s,o as n,c as a,Q as e}from"./chunks/framework.a767a766.js";const b=JSON.parse('{"title":"前言","description":"","frontmatter":{},"headers":[],"relativePath":"ruby_tool.md","filePath":"ruby_tool.md"}'),p={name:"ruby_tool.md"},l=e(`<h1 id="前言" tabindex="-1">前言 <a class="header-anchor" href="#前言" aria-label="Permalink to &quot;前言&quot;">​</a></h1><p>在大多数iOS项目中，都会使用CocoaPods作为三方库的包管理工具，某些项目还会使用Bundler来约束CocoaPods的版本、管理CocoaPods的插件等，而CocoaPods和Bundler作为Gem包，通常会使用RubyGems来安装和管理。</p><p>RubyGems、Bundler、CocoaPods都是Ruby语言开发的工具，我们在使用这套工具链的过程中，或许对中间的运行过程知之甚少，遇到问题也会有诸多疑惑。</p><p>本文将从Bundler和CocoaPods命令执行流程的角度，来理解整个工具链的运行原理。让大家在后续使用过程中，知道在终端敲下命令后，背后发生了什么，以及遇到问题怎么定位，甚至可以借鉴前辈们的思路，创造自己的工具。</p><hr><h1 id="bundle-exec-pod-xxx-执行流程" tabindex="-1">bundle exec pod xxx 执行流程 <a class="header-anchor" href="#bundle-exec-pod-xxx-执行流程" aria-label="Permalink to &quot;bundle exec pod xxx 执行流程&quot;">​</a></h1><p>直接执行<code>pod</code>命令，流程中只会涉及到RubyGems和Cocoapods，为了理解包括Bundler在内的整体工具链的运行原理，本文将对<code>bundle exec pod xxx</code>的运行过程进行剖析（<code>xxx</code>代表<code>pod</code>的任意子命令），而且理解了<code>bundle exec pod xxx</code>运行执行过程，对于<code>pod</code>命令运行过程的理解便是水到渠成的事。</p><p>先简单梳理下<code>bundle exec pod xxx</code>的执行流程，如果有不理解的地方可以先跳过，后面会对各个环节的细节展开描述。</p><p><strong>当在终端敲下<code>bundle exec pod xxx</code>时</strong>：</p><p>1、Shell命令行解释器解析出bundle命令，根据环境变量$PATH查找到bundle可执行文件</p><p>2、读取bundle可执行文件第一行shebang（!#），找到ruby解释器路径，开启新进程，加载执行ruby解释器程序，后续由ruby解释器解释执行bundle可执行文件的其他代码</p><p>3、RubyGems从已安装的Gem包中查找指定版本的bundler，加载执行bundler中的bundle脚本文件，进入bundler程序</p><p>4、bundler的CLI解析命令，解析出pod命令和参数install，分发给Bundler::Exec</p><p>5、Bundler::Exec查找pod的可执行文件，加载并执行pod可执行文件的代码</p><p>6、pod可执行文件和前面的bundle可执行文件类似，查找指定版本的Cocoapods，并找到Cocoapods里的pod可执行文件加载执行，进入Cocoapods程序</p><p>以上就是整体流程，接下来分析流程中各环节的细节</p><hr><h1 id="shell命令行解释器处理bundle命令" tabindex="-1">Shell命令行解释器处理<code>bundle</code>命令 <a class="header-anchor" href="#shell命令行解释器处理bundle命令" aria-label="Permalink to &quot;Shell命令行解释器处理\`bundle\`命令&quot;">​</a></h1><p>每开一个终端，操作系统就会启动一个Shell命令行解释器程序，Shell命令行解释器会进入一个循环，等待并解析用户输入命令。</p><p>终端上可以通过<code>watch ps</code>查看当前正在运行的进程。如果没有<code>watch</code>命令，可通过<code>brew install watch</code>安装。</p><p>从 macOS Catalina 开始，<strong>Zsh</strong> 成为默认的Shell解释器。可以通过<code>echo $SHELL</code>查看当前的Shell解释器。更多关于mac上终端和Shell相关知识可以参考 <a href="https://support.apple.com/zh-cn/guide/terminal" target="_blank" rel="noreferrer">终端使用手册</a>。关于<strong>Zsh</strong> 的源码可以通过<a href="https://zsh.sourceforge.io/" target="_blank" rel="noreferrer">https://zsh.sourceforge.io/</a>下载。</p><p>当用户输入命令并按回车键后，Shell解释器解析出命令，例如<code>bundle</code>，然后通过环境变量<code>$PATH</code>查找名为<code>bundle</code>的可执行文件的路径。</p><div class="language-shell vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">shell</span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#B392F0;">$</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">echo</span><span style="color:#E1E4E8;"> $PATH </span><span style="color:#9ECBFF;"> </span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;"> </span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;"> </span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;"> </span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;"> </span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;"> </span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;"> </span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;"> </span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;"> </span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;"> </span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;"> </span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;"> </span></span>
<span class="line"><span style="color:#B392F0;">/Users/用户名/.rvm/gems/ruby-3.0.0/bin:/Users/用户名/.rvm/gems/ruby-3.0.0@global/bin:/Users/用户名/.rvm/rubies/ruby-3.0.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/Library/Apple/usr/bin:/Users/用户名/.rvm/bin</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#6F42C1;">$</span><span style="color:#24292E;"> </span><span style="color:#032F62;">echo</span><span style="color:#24292E;"> $PATH </span><span style="color:#032F62;"> </span><span style="color:#24292E;"> </span><span style="color:#032F62;"> </span><span style="color:#24292E;"> </span><span style="color:#032F62;"> </span><span style="color:#24292E;"> </span><span style="color:#032F62;"> </span><span style="color:#24292E;"> </span><span style="color:#032F62;"> </span><span style="color:#24292E;"> </span><span style="color:#032F62;"> </span><span style="color:#24292E;"> </span><span style="color:#032F62;"> </span><span style="color:#24292E;"> </span><span style="color:#032F62;"> </span><span style="color:#24292E;"> </span><span style="color:#032F62;"> </span><span style="color:#24292E;"> </span><span style="color:#032F62;"> </span><span style="color:#24292E;"> </span><span style="color:#032F62;"> </span><span style="color:#24292E;"> </span><span style="color:#032F62;"> </span></span>
<span class="line"><span style="color:#6F42C1;">/Users/用户名/.rvm/gems/ruby-3.0.0/bin:/Users/用户名/.rvm/gems/ruby-3.0.0@global/bin:/Users/用户名/.rvm/rubies/ruby-3.0.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/Library/Apple/usr/bin:/Users/用户名/.rvm/bin</span></span></code></pre></div><p>以<code>:</code>将$PATH分隔成多个路径，然后从前往后，查找某路径下是否有命令的可执行文件。例如打开<code>/Users/用户名/.rvm/gems/ruby-3.0.0/bin</code>，可以看到<code>bundle</code>可执行文件等。</p><p><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e62e51ec6ec049d6a6e3ac7220beb163~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1458&amp;h=630&amp;s=144055&amp;e=png&amp;b=fcfcfc" alt="image.png"></p><p>也可以在终端通过<code>which bundle</code>查看可执行文件的路径：</p><div class="language-shell vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">shell</span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#B392F0;">$</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">which</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">bundle</span></span>
<span class="line"><span style="color:#B392F0;">/Users/用户名/.rvm/gems/ruby-3.0.0/bin/bundle</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#6F42C1;">$</span><span style="color:#24292E;"> </span><span style="color:#032F62;">which</span><span style="color:#24292E;"> </span><span style="color:#032F62;">bundle</span></span>
<span class="line"><span style="color:#6F42C1;">/Users/用户名/.rvm/gems/ruby-3.0.0/bin/bundle</span></span></code></pre></div><h2 id="ruby解释器" tabindex="-1">Ruby解释器 <a class="header-anchor" href="#ruby解释器" aria-label="Permalink to &quot;Ruby解释器&quot;">​</a></h2><p>通过<code>cat</code>查看上述<code>bundle</code>可执行文件的内容：</p><div class="language-ruby vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">ruby</span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#E1E4E8;">$ cat </span><span style="color:#F97583;">/</span><span style="color:#79B8FF;">Users</span><span style="color:#F97583;">/</span><span style="color:#E1E4E8;">用户名</span><span style="color:#F97583;">/</span><span style="color:#E1E4E8;">.rvm</span><span style="color:#F97583;">/</span><span style="color:#E1E4E8;">gems</span><span style="color:#F97583;">/</span><span style="color:#E1E4E8;">ruby</span><span style="color:#F97583;">-</span><span style="color:#79B8FF;">3.0</span><span style="color:#E1E4E8;">.</span><span style="color:#79B8FF;">0</span><span style="color:#F97583;">/</span><span style="color:#E1E4E8;">bin</span><span style="color:#F97583;">/</span><span style="color:#E1E4E8;">bundle</span></span>
<span class="line"></span>
<span class="line"><span style="color:#6A737D;">#!/Users/用户名/.rvm/rubies/ruby-3.0.0/bin/ruby</span></span>
<span class="line"><span style="color:#6A737D;">#</span></span>
<span class="line"><span style="color:#6A737D;"># This file was generated by RubyGems.</span></span>
<span class="line"><span style="color:#6A737D;">#</span></span>
<span class="line"><span style="color:#6A737D;"># The application &#39;bundler&#39; is installed as part of a gem, and</span></span>
<span class="line"><span style="color:#6A737D;"># this file is here to facilitate running it.</span></span>
<span class="line"><span style="color:#6A737D;">#</span></span>
<span class="line"></span>
<span class="line"><span style="color:#6A737D;"># 加载rubygems (lib目录下)</span></span>
<span class="line"><span style="color:#F97583;">require</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">&#39;rubygems&#39;</span></span>
<span class="line"></span>
<span class="line"><span style="color:#E1E4E8;">version </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">&quot;&gt;= 0.a&quot;</span></span>
<span class="line"></span>
<span class="line"><span style="color:#6A737D;"># 检查参数中是否存在以下划线包围的版本号，如果是，则取有效的版本号</span></span>
<span class="line"><span style="color:#E1E4E8;">str </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">ARGV</span><span style="color:#E1E4E8;">.first</span></span>
<span class="line"><span style="color:#F97583;">if</span><span style="color:#E1E4E8;"> str</span></span>
<span class="line"><span style="color:#E1E4E8;">  str </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> str.b[</span><span style="color:#9ECBFF;">/</span><span style="color:#85E89D;font-weight:bold;">\\A</span><span style="color:#DBEDFF;">_(.*)_</span><span style="color:#85E89D;font-weight:bold;">\\z</span><span style="color:#9ECBFF;">/</span><span style="color:#E1E4E8;">, </span><span style="color:#79B8FF;">1</span><span style="color:#E1E4E8;">]</span></span>
<span class="line"><span style="color:#E1E4E8;">  </span><span style="color:#F97583;">if</span><span style="color:#E1E4E8;"> str </span><span style="color:#F97583;">and</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">Gem</span><span style="color:#E1E4E8;">::</span><span style="color:#79B8FF;">Version</span><span style="color:#E1E4E8;">.correct?(str)</span></span>
<span class="line"><span style="color:#E1E4E8;">    version </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> str</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#79B8FF;">ARGV</span><span style="color:#E1E4E8;">.shift</span></span>
<span class="line"><span style="color:#E1E4E8;">  </span><span style="color:#F97583;">end</span></span>
<span class="line"><span style="color:#F97583;">end</span></span>
<span class="line"></span>
<span class="line"><span style="color:#6A737D;"># rubygems新版本中执行activate_bin_path方法</span></span>
<span class="line"><span style="color:#F97583;">if</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">Gem</span><span style="color:#E1E4E8;">.respond_to?(</span><span style="color:#79B8FF;">:activate_bin_path</span><span style="color:#E1E4E8;">)</span></span>
<span class="line"><span style="color:#E1E4E8;">  </span><span style="color:#6A737D;"># 查找bundler中名为bundle的可执行文件，加载并执行 （bundler是Gem包的名称，bundle是可执行文件名称）</span></span>
<span class="line"><span style="color:#E1E4E8;">	</span><span style="color:#79B8FF;">load</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">Gem</span><span style="color:#E1E4E8;">.activate_bin_path(</span><span style="color:#9ECBFF;">&#39;bundler&#39;</span><span style="color:#E1E4E8;">, </span><span style="color:#9ECBFF;">&#39;bundle&#39;</span><span style="color:#E1E4E8;">, version)</span></span>
<span class="line"><span style="color:#F97583;">else</span></span>
<span class="line"><span style="color:#E1E4E8;">	gem </span><span style="color:#9ECBFF;">&quot;bundler&quot;</span><span style="color:#E1E4E8;">, version</span></span>
<span class="line"><span style="color:#E1E4E8;">	</span><span style="color:#79B8FF;">load</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">Gem</span><span style="color:#E1E4E8;">.bin_path(</span><span style="color:#9ECBFF;">&quot;bundler&quot;</span><span style="color:#E1E4E8;">, </span><span style="color:#9ECBFF;">&quot;bundle&quot;</span><span style="color:#E1E4E8;">, version)</span></span>
<span class="line"><span style="color:#F97583;">end</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#24292E;">$ cat </span><span style="color:#D73A49;">/</span><span style="color:#005CC5;">Users</span><span style="color:#D73A49;">/</span><span style="color:#24292E;">用户名</span><span style="color:#D73A49;">/</span><span style="color:#24292E;">.rvm</span><span style="color:#D73A49;">/</span><span style="color:#24292E;">gems</span><span style="color:#D73A49;">/</span><span style="color:#24292E;">ruby</span><span style="color:#D73A49;">-</span><span style="color:#005CC5;">3.0</span><span style="color:#24292E;">.</span><span style="color:#005CC5;">0</span><span style="color:#D73A49;">/</span><span style="color:#24292E;">bin</span><span style="color:#D73A49;">/</span><span style="color:#24292E;">bundle</span></span>
<span class="line"></span>
<span class="line"><span style="color:#6A737D;">#!/Users/用户名/.rvm/rubies/ruby-3.0.0/bin/ruby</span></span>
<span class="line"><span style="color:#6A737D;">#</span></span>
<span class="line"><span style="color:#6A737D;"># This file was generated by RubyGems.</span></span>
<span class="line"><span style="color:#6A737D;">#</span></span>
<span class="line"><span style="color:#6A737D;"># The application &#39;bundler&#39; is installed as part of a gem, and</span></span>
<span class="line"><span style="color:#6A737D;"># this file is here to facilitate running it.</span></span>
<span class="line"><span style="color:#6A737D;">#</span></span>
<span class="line"></span>
<span class="line"><span style="color:#6A737D;"># 加载rubygems (lib目录下)</span></span>
<span class="line"><span style="color:#D73A49;">require</span><span style="color:#24292E;"> </span><span style="color:#032F62;">&#39;rubygems&#39;</span></span>
<span class="line"></span>
<span class="line"><span style="color:#24292E;">version </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#032F62;">&quot;&gt;= 0.a&quot;</span></span>
<span class="line"></span>
<span class="line"><span style="color:#6A737D;"># 检查参数中是否存在以下划线包围的版本号，如果是，则取有效的版本号</span></span>
<span class="line"><span style="color:#24292E;">str </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">ARGV</span><span style="color:#24292E;">.first</span></span>
<span class="line"><span style="color:#D73A49;">if</span><span style="color:#24292E;"> str</span></span>
<span class="line"><span style="color:#24292E;">  str </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> str.b[</span><span style="color:#032F62;">/</span><span style="color:#22863A;font-weight:bold;">\\A</span><span style="color:#032F62;">_(.*)_</span><span style="color:#22863A;font-weight:bold;">\\z</span><span style="color:#032F62;">/</span><span style="color:#24292E;">, </span><span style="color:#005CC5;">1</span><span style="color:#24292E;">]</span></span>
<span class="line"><span style="color:#24292E;">  </span><span style="color:#D73A49;">if</span><span style="color:#24292E;"> str </span><span style="color:#D73A49;">and</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">Gem</span><span style="color:#24292E;">::</span><span style="color:#005CC5;">Version</span><span style="color:#24292E;">.correct?(str)</span></span>
<span class="line"><span style="color:#24292E;">    version </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> str</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#005CC5;">ARGV</span><span style="color:#24292E;">.shift</span></span>
<span class="line"><span style="color:#24292E;">  </span><span style="color:#D73A49;">end</span></span>
<span class="line"><span style="color:#D73A49;">end</span></span>
<span class="line"></span>
<span class="line"><span style="color:#6A737D;"># rubygems新版本中执行activate_bin_path方法</span></span>
<span class="line"><span style="color:#D73A49;">if</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">Gem</span><span style="color:#24292E;">.respond_to?(</span><span style="color:#005CC5;">:activate_bin_path</span><span style="color:#24292E;">)</span></span>
<span class="line"><span style="color:#24292E;">  </span><span style="color:#6A737D;"># 查找bundler中名为bundle的可执行文件，加载并执行 （bundler是Gem包的名称，bundle是可执行文件名称）</span></span>
<span class="line"><span style="color:#24292E;">	</span><span style="color:#005CC5;">load</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">Gem</span><span style="color:#24292E;">.activate_bin_path(</span><span style="color:#032F62;">&#39;bundler&#39;</span><span style="color:#24292E;">, </span><span style="color:#032F62;">&#39;bundle&#39;</span><span style="color:#24292E;">, version)</span></span>
<span class="line"><span style="color:#D73A49;">else</span></span>
<span class="line"><span style="color:#24292E;">	gem </span><span style="color:#032F62;">&quot;bundler&quot;</span><span style="color:#24292E;">, version</span></span>
<span class="line"><span style="color:#24292E;">	</span><span style="color:#005CC5;">load</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">Gem</span><span style="color:#24292E;">.bin_path(</span><span style="color:#032F62;">&quot;bundler&quot;</span><span style="color:#24292E;">, </span><span style="color:#032F62;">&quot;bundle&quot;</span><span style="color:#24292E;">, version)</span></span>
<span class="line"><span style="color:#D73A49;">end</span></span></code></pre></div><p>其内容的第一行shebang（#!）指明了执行该程序的解释器为<code>#!/Users/用户名/.rvm/rubies/ruby-3.0.0/bin/ruby</code>。Shell解释器读到这一行之后，便会开启一个新进程，加载ruby解释器，后续的工作交给ruby解释器程序。</p><p>这里的ruby是使用了RVM进行了版本控制，可以通过路径<code>/Users/用户名/.rvm/src/ruby-3.0.0</code>看到ruby的源码。简单看一下ruby的<code>main</code>函数:</p><div class="language-c vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">c</span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#F97583;">int</span></span>
<span class="line"><span style="color:#B392F0;">main</span><span style="color:#E1E4E8;">(</span><span style="color:#F97583;">int</span><span style="color:#E1E4E8;"> </span><span style="color:#FFAB70;">argc</span><span style="color:#E1E4E8;">, </span><span style="color:#F97583;">char</span><span style="color:#E1E4E8;"> </span><span style="color:#F97583;">**</span><span style="color:#FFAB70;">argv</span><span style="color:#E1E4E8;">)</span></span>
<span class="line"><span style="color:#E1E4E8;">{</span></span>
<span class="line"><span style="color:#F97583;">#ifdef</span><span style="color:#E1E4E8;"> </span><span style="color:#B392F0;">RUBY_DEBUG_ENV</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#B392F0;">ruby_set_debug_option</span><span style="color:#E1E4E8;">(</span><span style="color:#B392F0;">getenv</span><span style="color:#E1E4E8;">(</span><span style="color:#9ECBFF;">&quot;RUBY_DEBUG&quot;</span><span style="color:#E1E4E8;">));</span></span>
<span class="line"><span style="color:#F97583;">#endif</span></span>
<span class="line"><span style="color:#F97583;">#ifdef</span><span style="color:#E1E4E8;"> </span><span style="color:#B392F0;">HAVE_LOCALE_H</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#B392F0;">setlocale</span><span style="color:#E1E4E8;">(LC_CTYPE, </span><span style="color:#9ECBFF;">&quot;&quot;</span><span style="color:#E1E4E8;">);</span></span>
<span class="line"><span style="color:#F97583;">#endif</span></span>
<span class="line"></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#B392F0;">ruby_sysinit</span><span style="color:#E1E4E8;">(</span><span style="color:#F97583;">&amp;</span><span style="color:#E1E4E8;">argc, </span><span style="color:#F97583;">&amp;</span><span style="color:#E1E4E8;">argv);</span></span>
<span class="line"><span style="color:#E1E4E8;">    {</span></span>
<span class="line"><span style="color:#E1E4E8;">	RUBY_INIT_STACK;</span></span>
<span class="line"><span style="color:#E1E4E8;">	</span><span style="color:#B392F0;">ruby_init</span><span style="color:#E1E4E8;">();</span></span>
<span class="line"><span style="color:#E1E4E8;">	</span><span style="color:#F97583;">return</span><span style="color:#E1E4E8;"> </span><span style="color:#B392F0;">ruby_run_node</span><span style="color:#E1E4E8;">(</span><span style="color:#B392F0;">ruby_options</span><span style="color:#E1E4E8;">(argc, argv));</span></span>
<span class="line"><span style="color:#E1E4E8;">    }</span></span>
<span class="line"><span style="color:#E1E4E8;">}</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#D73A49;">int</span></span>
<span class="line"><span style="color:#6F42C1;">main</span><span style="color:#24292E;">(</span><span style="color:#D73A49;">int</span><span style="color:#24292E;"> </span><span style="color:#E36209;">argc</span><span style="color:#24292E;">, </span><span style="color:#D73A49;">char</span><span style="color:#24292E;"> </span><span style="color:#D73A49;">**</span><span style="color:#E36209;">argv</span><span style="color:#24292E;">)</span></span>
<span class="line"><span style="color:#24292E;">{</span></span>
<span class="line"><span style="color:#D73A49;">#ifdef</span><span style="color:#24292E;"> </span><span style="color:#6F42C1;">RUBY_DEBUG_ENV</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#6F42C1;">ruby_set_debug_option</span><span style="color:#24292E;">(</span><span style="color:#6F42C1;">getenv</span><span style="color:#24292E;">(</span><span style="color:#032F62;">&quot;RUBY_DEBUG&quot;</span><span style="color:#24292E;">));</span></span>
<span class="line"><span style="color:#D73A49;">#endif</span></span>
<span class="line"><span style="color:#D73A49;">#ifdef</span><span style="color:#24292E;"> </span><span style="color:#6F42C1;">HAVE_LOCALE_H</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#6F42C1;">setlocale</span><span style="color:#24292E;">(LC_CTYPE, </span><span style="color:#032F62;">&quot;&quot;</span><span style="color:#24292E;">);</span></span>
<span class="line"><span style="color:#D73A49;">#endif</span></span>
<span class="line"></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#6F42C1;">ruby_sysinit</span><span style="color:#24292E;">(</span><span style="color:#D73A49;">&amp;</span><span style="color:#24292E;">argc, </span><span style="color:#D73A49;">&amp;</span><span style="color:#24292E;">argv);</span></span>
<span class="line"><span style="color:#24292E;">    {</span></span>
<span class="line"><span style="color:#24292E;">	RUBY_INIT_STACK;</span></span>
<span class="line"><span style="color:#24292E;">	</span><span style="color:#6F42C1;">ruby_init</span><span style="color:#24292E;">();</span></span>
<span class="line"><span style="color:#24292E;">	</span><span style="color:#D73A49;">return</span><span style="color:#24292E;"> </span><span style="color:#6F42C1;">ruby_run_node</span><span style="color:#24292E;">(</span><span style="color:#6F42C1;">ruby_options</span><span style="color:#24292E;">(argc, argv));</span></span>
<span class="line"><span style="color:#24292E;">    }</span></span>
<span class="line"><span style="color:#24292E;">}</span></span></code></pre></div><p>ruby程序正式运行前，会通过<code>ruby_options</code>函数读取环境变量<code>RUBYOPT</code>（ruby解释器选项），可以通过设置环境变量<code>RUBYOPT</code>来自定义ruby解释器的行为，例如<code>-r/Users/用户名/.auto_bundler.rb</code>，ruby程序运行前会加载<code>/Users/用户名/.auto_bundler.rb</code>。我们可以利用该机制，在iOS项目下执行<code>pod xxx</code>时，检查如果存在<code>Gemfile</code>文件，自动将<code>pod xxx</code>替换成<code>bundle exec pod xxx</code>，从而达到省去<code>bundle exec</code>的目的。</p><h1 id="rubygems中查找gem包" tabindex="-1">RubyGems中查找Gem包 <a class="header-anchor" href="#rubygems中查找gem包" aria-label="Permalink to &quot;RubyGems中查找Gem包&quot;">​</a></h1><p>通过上述<code>bundle</code>可执行文件的内容，我们还可以知道该文件是由<code>RubyGems</code>在安装bundler时生成，也就是在<code>gem install bundler</code>过程中生成的。</p><p><code>RubyGems</code>是ruby库（Gem）的包管理工具，github源码地址 <a href="https://github.com/rubygems/rubygems.git" target="_blank" rel="noreferrer">https://github.com/rubygems/rubygems.git</a>, 安装到电脑上的源码地址 <code>~/.rvm/rubies/ruby-x.x.x/lib/ruby/x.x.x</code> 。其命令行工具的一级命令是<code>gem</code>。</p><p>当执行<code>gem install xxx</code>安装Gem完成后，会结合Gem的<code>gemspec</code>文件里<code>executables</code>指定的名称，生成对应的可执行文件，并写入<code>～/.rvm/rubies/ruby-x.x.x/bin</code>目录下。源码细节可以查看<code>RubyGems</code>的<code>installer.rb</code>文件中的<code>install</code>和<code>generate_bin</code>方法。</p><p><code>RubyGems</code>生成的<code>bundle</code>以及其他Gem的可执行文件核心逻辑，是去查找指定版本的Gem包里的可执行文件，加载并执行。以下是<code>RubyGems</code>3.0.0版本的查找逻辑：</p><p>rubygems.rb：</p><div class="language-ruby vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">ruby</span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#F97583;">def</span><span style="color:#E1E4E8;"> </span><span style="color:#B392F0;">self.activate_bin_path</span><span style="color:#E1E4E8;">(name, exec_name </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">nil</span><span style="color:#E1E4E8;">, </span><span style="color:#F97583;">*</span><span style="color:#E1E4E8;">requirements) </span><span style="color:#6A737D;"># :nodoc:</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#6A737D;"># 查找gemspec文件，返回Gem::Specification对象</span></span>
<span class="line"><span style="color:#E1E4E8;">    spec </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> find_spec_for_exe name, exec_name, requirements</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#79B8FF;">Gem</span><span style="color:#E1E4E8;">::</span><span style="color:#79B8FF;">LOADED_SPECS_MUTEX</span><span style="color:#E1E4E8;">.synchronize </span><span style="color:#F97583;">do</span></span>
<span class="line"><span style="color:#E1E4E8;">      </span><span style="color:#6A737D;"># 这两行核心逻辑是将Gem的依赖项以及自己的gemspec文件里的require_paths（lib目录）添加到$LOAD_PATH中</span></span>
<span class="line"><span style="color:#E1E4E8;">      spec.activate</span></span>
<span class="line"><span style="color:#E1E4E8;">      finish_resolve</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#F97583;">end</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#6A737D;"># 拼接完整的可执行文件路径并返回</span></span>
<span class="line"><span style="color:#E1E4E8;">    spec.bin_file exec_name</span></span>
<span class="line"><span style="color:#E1E4E8;">  </span><span style="color:#F97583;">end</span></span>
<span class="line"></span>
<span class="line"><span style="color:#F97583;">def</span><span style="color:#E1E4E8;"> </span><span style="color:#B392F0;">self.find_spec_for_exe</span><span style="color:#E1E4E8;">(name, exec_name, requirements)</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#F97583;">raise</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">ArgumentError</span><span style="color:#E1E4E8;">, </span><span style="color:#9ECBFF;">&quot;you must supply exec_name&quot;</span><span style="color:#E1E4E8;"> </span><span style="color:#F97583;">unless</span><span style="color:#E1E4E8;"> exec_name</span></span>
<span class="line"><span style="color:#E1E4E8;">  	</span><span style="color:#6A737D;"># 通过Gem名和参数创建一个Gem::Dependency对象</span></span>
<span class="line"><span style="color:#E1E4E8;">    dep </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">Gem</span><span style="color:#E1E4E8;">::</span><span style="color:#79B8FF;">Dependency</span><span style="color:#E1E4E8;">.</span><span style="color:#F97583;">new</span><span style="color:#E1E4E8;"> name, requirements</span></span>
<span class="line"><span style="color:#E1E4E8;">  	</span><span style="color:#6A737D;"># 根据Gem名获取已加载的Gem的spec</span></span>
<span class="line"><span style="color:#E1E4E8;">    loaded </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">Gem</span><span style="color:#E1E4E8;">.loaded_specs[name]</span></span>
<span class="line"><span style="color:#E1E4E8;">  	</span><span style="color:#6A737D;"># 如果获取到已加载的Gem的spec并且是符合条件的，则直接返回</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#F97583;">return</span><span style="color:#E1E4E8;"> loaded </span><span style="color:#F97583;">if</span><span style="color:#E1E4E8;"> loaded </span><span style="color:#F97583;">&amp;&amp;</span><span style="color:#E1E4E8;"> dep.matches_spec?(loaded)</span></span>
<span class="line"><span style="color:#E1E4E8;">  	</span><span style="color:#6A737D;">#查找所有满足条件的spec</span></span>
<span class="line"><span style="color:#E1E4E8;">    specs </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> dep.matching_specs(</span><span style="color:#79B8FF;">true</span><span style="color:#E1E4E8;">)</span></span>
<span class="line"><span style="color:#E1E4E8;">		</span><span style="color:#6A737D;"># 过滤出executables包含传进来的可执行文件名的spec </span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#6A737D;">#（bundler的spec文件的executables：%w[bundle bundler]）</span></span>
<span class="line"><span style="color:#E1E4E8;">    specs </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> specs.find_all </span><span style="color:#F97583;">do</span><span style="color:#E1E4E8;"> |spec|</span></span>
<span class="line"><span style="color:#E1E4E8;">      spec.executables.include? exec_name</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#F97583;">end</span><span style="color:#E1E4E8;"> </span><span style="color:#F97583;">if</span><span style="color:#E1E4E8;"> exec_name</span></span>
<span class="line"></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#F97583;">unless</span><span style="color:#E1E4E8;"> spec </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> specs.first</span></span>
<span class="line"><span style="color:#E1E4E8;">      msg </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">&quot;can&#39;t find gem </span><span style="color:#9ECBFF;">#{dep}</span><span style="color:#9ECBFF;"> with executable </span><span style="color:#9ECBFF;">#{exec_name}</span><span style="color:#9ECBFF;">&quot;</span></span>
<span class="line"><span style="color:#E1E4E8;">      </span><span style="color:#F97583;">raise</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">Gem</span><span style="color:#E1E4E8;">::</span><span style="color:#79B8FF;">GemNotFoundException</span><span style="color:#E1E4E8;">, msg</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#F97583;">end</span></span>
<span class="line"></span>
<span class="line"><span style="color:#E1E4E8;">    spec</span></span>
<span class="line"><span style="color:#E1E4E8;">  </span><span style="color:#F97583;">end</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#D73A49;">def</span><span style="color:#24292E;"> </span><span style="color:#6F42C1;">self.activate_bin_path</span><span style="color:#24292E;">(name, exec_name </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">nil</span><span style="color:#24292E;">, </span><span style="color:#D73A49;">*</span><span style="color:#24292E;">requirements) </span><span style="color:#6A737D;"># :nodoc:</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#6A737D;"># 查找gemspec文件，返回Gem::Specification对象</span></span>
<span class="line"><span style="color:#24292E;">    spec </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> find_spec_for_exe name, exec_name, requirements</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#005CC5;">Gem</span><span style="color:#24292E;">::</span><span style="color:#005CC5;">LOADED_SPECS_MUTEX</span><span style="color:#24292E;">.synchronize </span><span style="color:#D73A49;">do</span></span>
<span class="line"><span style="color:#24292E;">      </span><span style="color:#6A737D;"># 这两行核心逻辑是将Gem的依赖项以及自己的gemspec文件里的require_paths（lib目录）添加到$LOAD_PATH中</span></span>
<span class="line"><span style="color:#24292E;">      spec.activate</span></span>
<span class="line"><span style="color:#24292E;">      finish_resolve</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#D73A49;">end</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#6A737D;"># 拼接完整的可执行文件路径并返回</span></span>
<span class="line"><span style="color:#24292E;">    spec.bin_file exec_name</span></span>
<span class="line"><span style="color:#24292E;">  </span><span style="color:#D73A49;">end</span></span>
<span class="line"></span>
<span class="line"><span style="color:#D73A49;">def</span><span style="color:#24292E;"> </span><span style="color:#6F42C1;">self.find_spec_for_exe</span><span style="color:#24292E;">(name, exec_name, requirements)</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#D73A49;">raise</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">ArgumentError</span><span style="color:#24292E;">, </span><span style="color:#032F62;">&quot;you must supply exec_name&quot;</span><span style="color:#24292E;"> </span><span style="color:#D73A49;">unless</span><span style="color:#24292E;"> exec_name</span></span>
<span class="line"><span style="color:#24292E;">  	</span><span style="color:#6A737D;"># 通过Gem名和参数创建一个Gem::Dependency对象</span></span>
<span class="line"><span style="color:#24292E;">    dep </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">Gem</span><span style="color:#24292E;">::</span><span style="color:#005CC5;">Dependency</span><span style="color:#24292E;">.</span><span style="color:#D73A49;">new</span><span style="color:#24292E;"> name, requirements</span></span>
<span class="line"><span style="color:#24292E;">  	</span><span style="color:#6A737D;"># 根据Gem名获取已加载的Gem的spec</span></span>
<span class="line"><span style="color:#24292E;">    loaded </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">Gem</span><span style="color:#24292E;">.loaded_specs[name]</span></span>
<span class="line"><span style="color:#24292E;">  	</span><span style="color:#6A737D;"># 如果获取到已加载的Gem的spec并且是符合条件的，则直接返回</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#D73A49;">return</span><span style="color:#24292E;"> loaded </span><span style="color:#D73A49;">if</span><span style="color:#24292E;"> loaded </span><span style="color:#D73A49;">&amp;&amp;</span><span style="color:#24292E;"> dep.matches_spec?(loaded)</span></span>
<span class="line"><span style="color:#24292E;">  	</span><span style="color:#6A737D;">#查找所有满足条件的spec</span></span>
<span class="line"><span style="color:#24292E;">    specs </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> dep.matching_specs(</span><span style="color:#005CC5;">true</span><span style="color:#24292E;">)</span></span>
<span class="line"><span style="color:#24292E;">		</span><span style="color:#6A737D;"># 过滤出executables包含传进来的可执行文件名的spec </span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#6A737D;">#（bundler的spec文件的executables：%w[bundle bundler]）</span></span>
<span class="line"><span style="color:#24292E;">    specs </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> specs.find_all </span><span style="color:#D73A49;">do</span><span style="color:#24292E;"> |spec|</span></span>
<span class="line"><span style="color:#24292E;">      spec.executables.include? exec_name</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#D73A49;">end</span><span style="color:#24292E;"> </span><span style="color:#D73A49;">if</span><span style="color:#24292E;"> exec_name</span></span>
<span class="line"></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#D73A49;">unless</span><span style="color:#24292E;"> spec </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> specs.first</span></span>
<span class="line"><span style="color:#24292E;">      msg </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#032F62;">&quot;can&#39;t find gem </span><span style="color:#032F62;">#{dep}</span><span style="color:#032F62;"> with executable </span><span style="color:#032F62;">#{exec_name}</span><span style="color:#032F62;">&quot;</span></span>
<span class="line"><span style="color:#24292E;">      </span><span style="color:#D73A49;">raise</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">Gem</span><span style="color:#24292E;">::</span><span style="color:#005CC5;">GemNotFoundException</span><span style="color:#24292E;">, msg</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#D73A49;">end</span></span>
<span class="line"></span>
<span class="line"><span style="color:#24292E;">    spec</span></span>
<span class="line"><span style="color:#24292E;">  </span><span style="color:#D73A49;">end</span></span></code></pre></div><p>dependency.rb：</p><div class="language-ruby vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">ruby</span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#F97583;">def</span><span style="color:#E1E4E8;"> </span><span style="color:#B392F0;">matching_specs</span><span style="color:#E1E4E8;">(platform_only </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">false</span><span style="color:#E1E4E8;">)</span></span>
<span class="line"><span style="color:#E1E4E8;">    env_req </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">Gem</span><span style="color:#E1E4E8;">.env_requirement(name)</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#6A737D;"># 对于多个版本的Gem,这里得到的是按版本降序的数组</span></span>
<span class="line"><span style="color:#E1E4E8;">    matches </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">Gem</span><span style="color:#E1E4E8;">::</span><span style="color:#79B8FF;">Specification</span><span style="color:#E1E4E8;">.stubs_for(name).find_all </span><span style="color:#F97583;">do</span><span style="color:#E1E4E8;"> |spec|</span></span>
<span class="line"><span style="color:#E1E4E8;">      requirement.satisfied_by?(spec.version) </span><span style="color:#F97583;">&amp;&amp;</span><span style="color:#E1E4E8;"> env_req.satisfied_by?(spec.version)</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#F97583;">end</span><span style="color:#E1E4E8;">.map(</span><span style="color:#F97583;">&amp;</span><span style="color:#79B8FF;">:to_spec</span><span style="color:#E1E4E8;">)</span></span>
<span class="line"></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#6A737D;"># 这里会针对bundler特殊处理</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#6A737D;"># 例如读取当前目录下Gemfile.lock文件里的“BUNDLED WITH xxx”的版本号xxx，将xxx版本号的spec放到matches的首位</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#6A737D;"># 关于bundler特殊处理的逻辑详见RubyGems里的bundler_version_finder</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#79B8FF;">Gem</span><span style="color:#E1E4E8;">::</span><span style="color:#79B8FF;">BundlerVersionFinder</span><span style="color:#E1E4E8;">.filter!(matches) </span><span style="color:#F97583;">if</span><span style="color:#E1E4E8;"> name </span><span style="color:#F97583;">==</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">&quot;bundler&quot;</span><span style="color:#E1E4E8;">.freeze </span><span style="color:#F97583;">&amp;&amp;</span><span style="color:#E1E4E8;"> </span><span style="color:#F97583;">!</span><span style="color:#E1E4E8;">requirement.specific?</span></span>
<span class="line"></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#F97583;">if</span><span style="color:#E1E4E8;"> platform_only</span></span>
<span class="line"><span style="color:#E1E4E8;">      matches.reject! </span><span style="color:#F97583;">do</span><span style="color:#E1E4E8;"> |spec|</span></span>
<span class="line"><span style="color:#E1E4E8;">        spec.nil? </span><span style="color:#F97583;">||</span><span style="color:#E1E4E8;"> </span><span style="color:#F97583;">!</span><span style="color:#79B8FF;">Gem</span><span style="color:#E1E4E8;">::</span><span style="color:#79B8FF;">Platform</span><span style="color:#E1E4E8;">.match_spec?(spec)</span></span>
<span class="line"><span style="color:#E1E4E8;">      </span><span style="color:#F97583;">end</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#F97583;">end</span></span>
<span class="line"></span>
<span class="line"><span style="color:#E1E4E8;">    matches</span></span>
<span class="line"><span style="color:#E1E4E8;">  </span><span style="color:#F97583;">end</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#D73A49;">def</span><span style="color:#24292E;"> </span><span style="color:#6F42C1;">matching_specs</span><span style="color:#24292E;">(platform_only </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">false</span><span style="color:#24292E;">)</span></span>
<span class="line"><span style="color:#24292E;">    env_req </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">Gem</span><span style="color:#24292E;">.env_requirement(name)</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#6A737D;"># 对于多个版本的Gem,这里得到的是按版本降序的数组</span></span>
<span class="line"><span style="color:#24292E;">    matches </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">Gem</span><span style="color:#24292E;">::</span><span style="color:#005CC5;">Specification</span><span style="color:#24292E;">.stubs_for(name).find_all </span><span style="color:#D73A49;">do</span><span style="color:#24292E;"> |spec|</span></span>
<span class="line"><span style="color:#24292E;">      requirement.satisfied_by?(spec.version) </span><span style="color:#D73A49;">&amp;&amp;</span><span style="color:#24292E;"> env_req.satisfied_by?(spec.version)</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#D73A49;">end</span><span style="color:#24292E;">.map(</span><span style="color:#D73A49;">&amp;</span><span style="color:#005CC5;">:to_spec</span><span style="color:#24292E;">)</span></span>
<span class="line"></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#6A737D;"># 这里会针对bundler特殊处理</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#6A737D;"># 例如读取当前目录下Gemfile.lock文件里的“BUNDLED WITH xxx”的版本号xxx，将xxx版本号的spec放到matches的首位</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#6A737D;"># 关于bundler特殊处理的逻辑详见RubyGems里的bundler_version_finder</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#005CC5;">Gem</span><span style="color:#24292E;">::</span><span style="color:#005CC5;">BundlerVersionFinder</span><span style="color:#24292E;">.filter!(matches) </span><span style="color:#D73A49;">if</span><span style="color:#24292E;"> name </span><span style="color:#D73A49;">==</span><span style="color:#24292E;"> </span><span style="color:#032F62;">&quot;bundler&quot;</span><span style="color:#24292E;">.freeze </span><span style="color:#D73A49;">&amp;&amp;</span><span style="color:#24292E;"> </span><span style="color:#D73A49;">!</span><span style="color:#24292E;">requirement.specific?</span></span>
<span class="line"></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#D73A49;">if</span><span style="color:#24292E;"> platform_only</span></span>
<span class="line"><span style="color:#24292E;">      matches.reject! </span><span style="color:#D73A49;">do</span><span style="color:#24292E;"> |spec|</span></span>
<span class="line"><span style="color:#24292E;">        spec.nil? </span><span style="color:#D73A49;">||</span><span style="color:#24292E;"> </span><span style="color:#D73A49;">!</span><span style="color:#005CC5;">Gem</span><span style="color:#24292E;">::</span><span style="color:#005CC5;">Platform</span><span style="color:#24292E;">.match_spec?(spec)</span></span>
<span class="line"><span style="color:#24292E;">      </span><span style="color:#D73A49;">end</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#D73A49;">end</span></span>
<span class="line"></span>
<span class="line"><span style="color:#24292E;">    matches</span></span>
<span class="line"><span style="color:#24292E;">  </span><span style="color:#D73A49;">end</span></span></code></pre></div><p>dependency.rb：</p><div class="language-ruby vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">ruby</span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#F97583;">def</span><span style="color:#E1E4E8;"> </span><span style="color:#B392F0;">self.stubs_for</span><span style="color:#E1E4E8;">(name)</span></span>
<span class="line"><span style="color:#E1E4E8;">  </span><span style="color:#F97583;">if</span><span style="color:#E1E4E8;"> @@stubs_by_name[name]</span></span>
<span class="line"><span style="color:#E1E4E8;">    @@stubs_by_name[name]</span></span>
<span class="line"><span style="color:#E1E4E8;">  </span><span style="color:#F97583;">else</span></span>
<span class="line"><span style="color:#E1E4E8;">    pattern </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">&quot;</span><span style="color:#9ECBFF;">#{name}</span><span style="color:#9ECBFF;">-*.gemspec&quot;</span></span>
<span class="line"><span style="color:#E1E4E8;">    stubs </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> installed_stubs(dirs, pattern).</span><span style="color:#79B8FF;">select</span><span style="color:#E1E4E8;"> {|s| </span><span style="color:#79B8FF;">Gem</span><span style="color:#E1E4E8;">::</span><span style="color:#79B8FF;">Platform</span><span style="color:#E1E4E8;">.match_spec? s } </span><span style="color:#F97583;">+</span><span style="color:#E1E4E8;"> default_stubs(pattern)</span></span>
<span class="line"><span style="color:#E1E4E8;">    stubs </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> stubs.uniq {|stub| stub.full_name }.group_by(</span><span style="color:#F97583;">&amp;</span><span style="color:#79B8FF;">:name</span><span style="color:#E1E4E8;">)</span></span>
<span class="line"><span style="color:#E1E4E8;">    stubs.each_value {|v| _resort!(v) }</span></span>
<span class="line"></span>
<span class="line"><span style="color:#E1E4E8;">    @@stubs_by_name.merge! stubs</span></span>
<span class="line"><span style="color:#E1E4E8;">    @@stubs_by_name[name] </span><span style="color:#F97583;">||=</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">EMPTY</span></span>
<span class="line"><span style="color:#E1E4E8;">  </span><span style="color:#F97583;">end</span></span>
<span class="line"><span style="color:#F97583;">end</span></span>
<span class="line"></span>
<span class="line"><span style="color:#6A737D;"># Gem名升序，版本号降序</span></span>
<span class="line"><span style="color:#F97583;">def</span><span style="color:#E1E4E8;"> </span><span style="color:#B392F0;">self._resort!</span><span style="color:#E1E4E8;">(specs) </span><span style="color:#6A737D;"># :nodoc:</span></span>
<span class="line"><span style="color:#E1E4E8;">    specs.sort! </span><span style="color:#F97583;">do</span><span style="color:#E1E4E8;"> |a, b|</span></span>
<span class="line"><span style="color:#E1E4E8;">      names </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> a.name </span><span style="color:#F97583;">&lt;=&gt;</span><span style="color:#E1E4E8;"> b.name</span></span>
<span class="line"><span style="color:#E1E4E8;">      </span><span style="color:#F97583;">next</span><span style="color:#E1E4E8;"> names </span><span style="color:#F97583;">if</span><span style="color:#E1E4E8;"> names.nonzero?</span></span>
<span class="line"><span style="color:#E1E4E8;">      versions </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> b.version </span><span style="color:#F97583;">&lt;=&gt;</span><span style="color:#E1E4E8;"> a.version</span></span>
<span class="line"><span style="color:#E1E4E8;">      </span><span style="color:#F97583;">next</span><span style="color:#E1E4E8;"> versions </span><span style="color:#F97583;">if</span><span style="color:#E1E4E8;"> versions.nonzero?</span></span>
<span class="line"><span style="color:#E1E4E8;">      </span><span style="color:#79B8FF;">Gem</span><span style="color:#E1E4E8;">::</span><span style="color:#79B8FF;">Platform</span><span style="color:#E1E4E8;">.sort_priority(b.platform)</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#F97583;">end</span></span>
<span class="line"><span style="color:#E1E4E8;">  </span><span style="color:#F97583;">end</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#D73A49;">def</span><span style="color:#24292E;"> </span><span style="color:#6F42C1;">self.stubs_for</span><span style="color:#24292E;">(name)</span></span>
<span class="line"><span style="color:#24292E;">  </span><span style="color:#D73A49;">if</span><span style="color:#24292E;"> @@stubs_by_name[name]</span></span>
<span class="line"><span style="color:#24292E;">    @@stubs_by_name[name]</span></span>
<span class="line"><span style="color:#24292E;">  </span><span style="color:#D73A49;">else</span></span>
<span class="line"><span style="color:#24292E;">    pattern </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#032F62;">&quot;</span><span style="color:#032F62;">#{name}</span><span style="color:#032F62;">-*.gemspec&quot;</span></span>
<span class="line"><span style="color:#24292E;">    stubs </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> installed_stubs(dirs, pattern).</span><span style="color:#005CC5;">select</span><span style="color:#24292E;"> {|s| </span><span style="color:#005CC5;">Gem</span><span style="color:#24292E;">::</span><span style="color:#005CC5;">Platform</span><span style="color:#24292E;">.match_spec? s } </span><span style="color:#D73A49;">+</span><span style="color:#24292E;"> default_stubs(pattern)</span></span>
<span class="line"><span style="color:#24292E;">    stubs </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> stubs.uniq {|stub| stub.full_name }.group_by(</span><span style="color:#D73A49;">&amp;</span><span style="color:#005CC5;">:name</span><span style="color:#24292E;">)</span></span>
<span class="line"><span style="color:#24292E;">    stubs.each_value {|v| _resort!(v) }</span></span>
<span class="line"></span>
<span class="line"><span style="color:#24292E;">    @@stubs_by_name.merge! stubs</span></span>
<span class="line"><span style="color:#24292E;">    @@stubs_by_name[name] </span><span style="color:#D73A49;">||=</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">EMPTY</span></span>
<span class="line"><span style="color:#24292E;">  </span><span style="color:#D73A49;">end</span></span>
<span class="line"><span style="color:#D73A49;">end</span></span>
<span class="line"></span>
<span class="line"><span style="color:#6A737D;"># Gem名升序，版本号降序</span></span>
<span class="line"><span style="color:#D73A49;">def</span><span style="color:#24292E;"> </span><span style="color:#6F42C1;">self._resort!</span><span style="color:#24292E;">(specs) </span><span style="color:#6A737D;"># :nodoc:</span></span>
<span class="line"><span style="color:#24292E;">    specs.sort! </span><span style="color:#D73A49;">do</span><span style="color:#24292E;"> |a, b|</span></span>
<span class="line"><span style="color:#24292E;">      names </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> a.name </span><span style="color:#D73A49;">&lt;=&gt;</span><span style="color:#24292E;"> b.name</span></span>
<span class="line"><span style="color:#24292E;">      </span><span style="color:#D73A49;">next</span><span style="color:#24292E;"> names </span><span style="color:#D73A49;">if</span><span style="color:#24292E;"> names.nonzero?</span></span>
<span class="line"><span style="color:#24292E;">      versions </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> b.version </span><span style="color:#D73A49;">&lt;=&gt;</span><span style="color:#24292E;"> a.version</span></span>
<span class="line"><span style="color:#24292E;">      </span><span style="color:#D73A49;">next</span><span style="color:#24292E;"> versions </span><span style="color:#D73A49;">if</span><span style="color:#24292E;"> versions.nonzero?</span></span>
<span class="line"><span style="color:#24292E;">      </span><span style="color:#005CC5;">Gem</span><span style="color:#24292E;">::</span><span style="color:#005CC5;">Platform</span><span style="color:#24292E;">.sort_priority(b.platform)</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#D73A49;">end</span></span>
<span class="line"><span style="color:#24292E;">  </span><span style="color:#D73A49;">end</span></span></code></pre></div><p><code>Gem::Dependency</code>的<code>matches_specs</code>方法是在<code>specifications</code>目录下查找符合条件的<code>gemspec</code>文件，存在多个版本时返回最大版本。但是对bundler做了特殊处理，可以通过设置环境变量或者在项目的<code>Gemfile中</code>指定bundler的版本等方式，返回需要的bundler版本。</p><p><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ea2cf9090fdb4352aa2d4d8c325b6239~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1428&amp;h=1030&amp;s=275888&amp;e=png&amp;b=fdfdfd" alt=""></p><h1 id="bundler查找指定版本的cocoapods" tabindex="-1">Bundler查找指定版本的Cocoapods <a class="header-anchor" href="#bundler查找指定版本的cocoapods" aria-label="Permalink to &quot;Bundler查找指定版本的Cocoapods&quot;">​</a></h1><p>Bundler是管理Gem依赖和版本的工具，其命令行工具的一级命令是<code>bundle</code>和<code>bundler</code>，两者是等效的。</p><p>Bundler的gemspec文件里的executables为%w[bundle bundler]</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#e1e4e8;">Gem::Specification.new do |s|</span></span>
<span class="line"><span style="color:#e1e4e8;">  s.name        = &quot;bundler&quot;</span></span>
<span class="line"><span style="color:#e1e4e8;">  s.version     = Bundler::VERSION</span></span>
<span class="line"><span style="color:#e1e4e8;">  # ...</span></span>
<span class="line"><span style="color:#e1e4e8;">  s.files = Dir.glob(&quot;lib/bundler{.rb,/**/*}&quot;, File::FNM_DOTMATCH).reject {|f| File.directory?(f) }</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;">  # include the gemspec itself because warbler breaks w/o it</span></span>
<span class="line"><span style="color:#e1e4e8;">  s.files += %w[bundler.gemspec]</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;">  s.files += %w[CHANGELOG.md LICENSE.md README.md]</span></span>
<span class="line"><span style="color:#e1e4e8;">  s.bindir        = &quot;exe&quot;</span></span>
<span class="line"><span style="color:#e1e4e8;">  s.executables   = %w[bundle bundler]</span></span>
<span class="line"><span style="color:#e1e4e8;">  s.require_paths = [&quot;lib&quot;]</span></span>
<span class="line"><span style="color:#e1e4e8;">end</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#24292e;">Gem::Specification.new do |s|</span></span>
<span class="line"><span style="color:#24292e;">  s.name        = &quot;bundler&quot;</span></span>
<span class="line"><span style="color:#24292e;">  s.version     = Bundler::VERSION</span></span>
<span class="line"><span style="color:#24292e;">  # ...</span></span>
<span class="line"><span style="color:#24292e;">  s.files = Dir.glob(&quot;lib/bundler{.rb,/**/*}&quot;, File::FNM_DOTMATCH).reject {|f| File.directory?(f) }</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;">  # include the gemspec itself because warbler breaks w/o it</span></span>
<span class="line"><span style="color:#24292e;">  s.files += %w[bundler.gemspec]</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;">  s.files += %w[CHANGELOG.md LICENSE.md README.md]</span></span>
<span class="line"><span style="color:#24292e;">  s.bindir        = &quot;exe&quot;</span></span>
<span class="line"><span style="color:#24292e;">  s.executables   = %w[bundle bundler]</span></span>
<span class="line"><span style="color:#24292e;">  s.require_paths = [&quot;lib&quot;]</span></span>
<span class="line"><span style="color:#24292e;">end</span></span></code></pre></div><p>安装之后RubyGems会生成bundle和bundler两个可执行文件，而Bundler包里既有bundle，也有bundler可执行文件，bundler的逻辑实际上是去加载bundle可执行文件，核心逻辑在bundle可执行文件中。</p><p>Bundler中的bundle可执行文件的核心代码：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#e1e4e8;">#!/usr/bin/env ruby</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;">base_path = File.expand_path(&quot;../lib&quot;, __dir__)</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;">if File.exist?(base_path)</span></span>
<span class="line"><span style="color:#e1e4e8;">  $LOAD_PATH.unshift(base_path)</span></span>
<span class="line"><span style="color:#e1e4e8;">end</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;">Bundler::CLI.start(args, :debug =&gt; true)</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#24292e;">#!/usr/bin/env ruby</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;">base_path = File.expand_path(&quot;../lib&quot;, __dir__)</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;">if File.exist?(base_path)</span></span>
<span class="line"><span style="color:#24292e;">  $LOAD_PATH.unshift(base_path)</span></span>
<span class="line"><span style="color:#24292e;">end</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;">Bundler::CLI.start(args, :debug =&gt; true)</span></span></code></pre></div><p>这个函数通过命令解析和分发，到达CLI::Exec的run函数:</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#e1e4e8;">def run</span></span>
<span class="line"><span style="color:#e1e4e8;">  validate_cmd!</span></span>
<span class="line"><span style="color:#e1e4e8;">  # 设置bundle环境</span></span>
<span class="line"><span style="color:#e1e4e8;">  SharedHelpers.set_bundle_environment</span></span>
<span class="line"><span style="color:#e1e4e8;">  # 查找pod的可执行文件</span></span>
<span class="line"><span style="color:#e1e4e8;">  if bin_path = Bundler.which(cmd)</span></span>
<span class="line"><span style="color:#e1e4e8;">    if !Bundler.settings[:disable_exec_load] &amp;&amp; ruby_shebang?(bin_path)</span></span>
<span class="line"><span style="color:#e1e4e8;">      # 加载pod可执行文件</span></span>
<span class="line"><span style="color:#e1e4e8;">      return kernel_load(bin_path, *args)</span></span>
<span class="line"><span style="color:#e1e4e8;">    end</span></span>
<span class="line"><span style="color:#e1e4e8;">    kernel_exec(bin_path, *args)</span></span>
<span class="line"><span style="color:#e1e4e8;">  else</span></span>
<span class="line"><span style="color:#e1e4e8;">    # exec using the given command</span></span>
<span class="line"><span style="color:#e1e4e8;">    kernel_exec(cmd, *args)</span></span>
<span class="line"><span style="color:#e1e4e8;">  end</span></span>
<span class="line"><span style="color:#e1e4e8;">end</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;">def kernel_load(file, *args)</span></span>
<span class="line"><span style="color:#e1e4e8;">    args.pop if args.last.is_a?(Hash)</span></span>
<span class="line"><span style="color:#e1e4e8;">    ARGV.replace(args)</span></span>
<span class="line"><span style="color:#e1e4e8;">    $0 = file</span></span>
<span class="line"><span style="color:#e1e4e8;">    Process.setproctitle(process_title(file, args)) if Process.respond_to?(:setproctitle)</span></span>
<span class="line"><span style="color:#e1e4e8;">    # 加载执行setup.rb文件</span></span>
<span class="line"><span style="color:#e1e4e8;">    require_relative &quot;../setup&quot;</span></span>
<span class="line"><span style="color:#e1e4e8;">    TRAPPED_SIGNALS.each {|s| trap(s, &quot;DEFAULT&quot;) }</span></span>
<span class="line"><span style="color:#e1e4e8;">    # 加载执行pod可执行文件</span></span>
<span class="line"><span style="color:#e1e4e8;">    Kernel.load(file)</span></span>
<span class="line"><span style="color:#e1e4e8;">  rescue SystemExit, SignalException</span></span>
<span class="line"><span style="color:#e1e4e8;">    raise</span></span>
<span class="line"><span style="color:#e1e4e8;">  rescue Exception # rubocop:disable Lint/RescueException</span></span>
<span class="line"><span style="color:#e1e4e8;">    Bundler.ui.error &quot;bundler: failed to load command: #{cmd} (#{file})&quot;</span></span>
<span class="line"><span style="color:#e1e4e8;">    Bundler::FriendlyErrors.disable!</span></span>
<span class="line"><span style="color:#e1e4e8;">    raise</span></span>
<span class="line"><span style="color:#e1e4e8;">end</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#24292e;">def run</span></span>
<span class="line"><span style="color:#24292e;">  validate_cmd!</span></span>
<span class="line"><span style="color:#24292e;">  # 设置bundle环境</span></span>
<span class="line"><span style="color:#24292e;">  SharedHelpers.set_bundle_environment</span></span>
<span class="line"><span style="color:#24292e;">  # 查找pod的可执行文件</span></span>
<span class="line"><span style="color:#24292e;">  if bin_path = Bundler.which(cmd)</span></span>
<span class="line"><span style="color:#24292e;">    if !Bundler.settings[:disable_exec_load] &amp;&amp; ruby_shebang?(bin_path)</span></span>
<span class="line"><span style="color:#24292e;">      # 加载pod可执行文件</span></span>
<span class="line"><span style="color:#24292e;">      return kernel_load(bin_path, *args)</span></span>
<span class="line"><span style="color:#24292e;">    end</span></span>
<span class="line"><span style="color:#24292e;">    kernel_exec(bin_path, *args)</span></span>
<span class="line"><span style="color:#24292e;">  else</span></span>
<span class="line"><span style="color:#24292e;">    # exec using the given command</span></span>
<span class="line"><span style="color:#24292e;">    kernel_exec(cmd, *args)</span></span>
<span class="line"><span style="color:#24292e;">  end</span></span>
<span class="line"><span style="color:#24292e;">end</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;">def kernel_load(file, *args)</span></span>
<span class="line"><span style="color:#24292e;">    args.pop if args.last.is_a?(Hash)</span></span>
<span class="line"><span style="color:#24292e;">    ARGV.replace(args)</span></span>
<span class="line"><span style="color:#24292e;">    $0 = file</span></span>
<span class="line"><span style="color:#24292e;">    Process.setproctitle(process_title(file, args)) if Process.respond_to?(:setproctitle)</span></span>
<span class="line"><span style="color:#24292e;">    # 加载执行setup.rb文件</span></span>
<span class="line"><span style="color:#24292e;">    require_relative &quot;../setup&quot;</span></span>
<span class="line"><span style="color:#24292e;">    TRAPPED_SIGNALS.each {|s| trap(s, &quot;DEFAULT&quot;) }</span></span>
<span class="line"><span style="color:#24292e;">    # 加载执行pod可执行文件</span></span>
<span class="line"><span style="color:#24292e;">    Kernel.load(file)</span></span>
<span class="line"><span style="color:#24292e;">  rescue SystemExit, SignalException</span></span>
<span class="line"><span style="color:#24292e;">    raise</span></span>
<span class="line"><span style="color:#24292e;">  rescue Exception # rubocop:disable Lint/RescueException</span></span>
<span class="line"><span style="color:#24292e;">    Bundler.ui.error &quot;bundler: failed to load command: #{cmd} (#{file})&quot;</span></span>
<span class="line"><span style="color:#24292e;">    Bundler::FriendlyErrors.disable!</span></span>
<span class="line"><span style="color:#24292e;">    raise</span></span>
<span class="line"><span style="color:#24292e;">end</span></span></code></pre></div><p>终端上通过which pod查看pod可执行文件的路径，再通过cat查看其内容，可以看到内容和bundler一致</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#e1e4e8;">$ which pod</span></span>
<span class="line"><span style="color:#e1e4e8;">/Users/yuanchao/.rvm/gems/ruby-3.0.0/bin/pod</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;">$ cat /Users/yuanchao/.rvm/gems/ruby-3.0.0/bin/pod</span></span>
<span class="line"><span style="color:#e1e4e8;">#!/Users/yuanchao/.rvm/rubies/ruby-3.0.0/bin/ruby</span></span>
<span class="line"><span style="color:#e1e4e8;">#</span></span>
<span class="line"><span style="color:#e1e4e8;"># This file was generated by RubyGems.</span></span>
<span class="line"><span style="color:#e1e4e8;">#</span></span>
<span class="line"><span style="color:#e1e4e8;"># The application &#39;cocoapods&#39; is installed as part of a gem, and</span></span>
<span class="line"><span style="color:#e1e4e8;"># this file is here to facilitate running it.</span></span>
<span class="line"><span style="color:#e1e4e8;">#</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;">require &#39;rubygems&#39;</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;">version = &quot;&gt;= 0.a&quot;</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;">str = ARGV.first</span></span>
<span class="line"><span style="color:#e1e4e8;">if str</span></span>
<span class="line"><span style="color:#e1e4e8;">  str = str.b[/\\A_(.*)_\\z/, 1]</span></span>
<span class="line"><span style="color:#e1e4e8;">  if str and Gem::Version.correct?(str)</span></span>
<span class="line"><span style="color:#e1e4e8;">    version = str</span></span>
<span class="line"><span style="color:#e1e4e8;">    ARGV.shift</span></span>
<span class="line"><span style="color:#e1e4e8;">  end</span></span>
<span class="line"><span style="color:#e1e4e8;">end</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;">if Gem.respond_to?(:activate_bin_path)</span></span>
<span class="line"><span style="color:#e1e4e8;">load Gem.activate_bin_path(&#39;cocoapods&#39;, &#39;pod&#39;, version)</span></span>
<span class="line"><span style="color:#e1e4e8;">else</span></span>
<span class="line"><span style="color:#e1e4e8;">gem &quot;cocoapods&quot;, version</span></span>
<span class="line"><span style="color:#e1e4e8;">load Gem.bin_path(&quot;cocoapods&quot;, &quot;pod&quot;, version)</span></span>
<span class="line"><span style="color:#e1e4e8;">end</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#24292e;">$ which pod</span></span>
<span class="line"><span style="color:#24292e;">/Users/yuanchao/.rvm/gems/ruby-3.0.0/bin/pod</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;">$ cat /Users/yuanchao/.rvm/gems/ruby-3.0.0/bin/pod</span></span>
<span class="line"><span style="color:#24292e;">#!/Users/yuanchao/.rvm/rubies/ruby-3.0.0/bin/ruby</span></span>
<span class="line"><span style="color:#24292e;">#</span></span>
<span class="line"><span style="color:#24292e;"># This file was generated by RubyGems.</span></span>
<span class="line"><span style="color:#24292e;">#</span></span>
<span class="line"><span style="color:#24292e;"># The application &#39;cocoapods&#39; is installed as part of a gem, and</span></span>
<span class="line"><span style="color:#24292e;"># this file is here to facilitate running it.</span></span>
<span class="line"><span style="color:#24292e;">#</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;">require &#39;rubygems&#39;</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;">version = &quot;&gt;= 0.a&quot;</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;">str = ARGV.first</span></span>
<span class="line"><span style="color:#24292e;">if str</span></span>
<span class="line"><span style="color:#24292e;">  str = str.b[/\\A_(.*)_\\z/, 1]</span></span>
<span class="line"><span style="color:#24292e;">  if str and Gem::Version.correct?(str)</span></span>
<span class="line"><span style="color:#24292e;">    version = str</span></span>
<span class="line"><span style="color:#24292e;">    ARGV.shift</span></span>
<span class="line"><span style="color:#24292e;">  end</span></span>
<span class="line"><span style="color:#24292e;">end</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;">if Gem.respond_to?(:activate_bin_path)</span></span>
<span class="line"><span style="color:#24292e;">load Gem.activate_bin_path(&#39;cocoapods&#39;, &#39;pod&#39;, version)</span></span>
<span class="line"><span style="color:#24292e;">else</span></span>
<span class="line"><span style="color:#24292e;">gem &quot;cocoapods&quot;, version</span></span>
<span class="line"><span style="color:#24292e;">load Gem.bin_path(&quot;cocoapods&quot;, &quot;pod&quot;, version)</span></span>
<span class="line"><span style="color:#24292e;">end</span></span></code></pre></div><p>按照前面rubygems查找bundler的方式，会找到最高版本的Cocoapods。那么，bundler将命令转发给pod前，是怎么查找到Gemfile.lock文件中指定版本的cocoapods或者其他Gem呢？</p><p>实际上Bundler替换了RubyGems的activate_bin_path和find_spec_for_exe等方法的实现。</p><p>上述的setup.rb中的核心代码是<code>Bundler.setup</code>，最终会执行到runtime.rb文件的<code>setup</code>方法</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#e1e4e8;">def setup(*groups)</span></span>
<span class="line"><span style="color:#e1e4e8;">    # @definition是有Gemfile和Gemfile.lock文件生成的</span></span>
<span class="line"><span style="color:#e1e4e8;">    @definition.ensure_equivalent_gemfile_and_lockfile if Bundler.frozen_bundle?</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;">    # Has to happen first</span></span>
<span class="line"><span style="color:#e1e4e8;">    clean_load_path</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;">    # 根据definition获取所有Gem的spec信息</span></span>
<span class="line"><span style="color:#e1e4e8;">    specs = @definition.specs_for(groups)</span></span>
<span class="line"><span style="color:#e1e4e8;">  	# 设置bundle的环境变量等</span></span>
<span class="line"><span style="color:#e1e4e8;">    SharedHelpers.set_bundle_environment</span></span>
<span class="line"><span style="color:#e1e4e8;">    # 替换RubyGems的一些方法，比如activate_bin_path和find_spec_for_exe等</span></span>
<span class="line"><span style="color:#e1e4e8;">    # 使Gem包从specs中获取（获取Gemfile中指定版本的Gem）</span></span>
<span class="line"><span style="color:#e1e4e8;">    Bundler.rubygems.replace_entrypoints(specs)</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;">    # 将Gem包lib目录添加到$Load_PATH</span></span>
<span class="line"><span style="color:#e1e4e8;">    # Activate the specs</span></span>
<span class="line"><span style="color:#e1e4e8;">    load_paths = specs.map do |spec|</span></span>
<span class="line"><span style="color:#e1e4e8;">      check_for_activated_spec!(spec)</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;">      Bundler.rubygems.mark_loaded(spec)</span></span>
<span class="line"><span style="color:#e1e4e8;">      spec.load_paths.reject {|path| $LOAD_PATH.include?(path) }</span></span>
<span class="line"><span style="color:#e1e4e8;">    end.reverse.flatten</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;">    Bundler.rubygems.add_to_load_path(load_paths)</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;">    setup_manpath</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;">    lock(:preserve_unknown_sections =&gt; true)</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;">    self</span></span>
<span class="line"><span style="color:#e1e4e8;">  end</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#24292e;">def setup(*groups)</span></span>
<span class="line"><span style="color:#24292e;">    # @definition是有Gemfile和Gemfile.lock文件生成的</span></span>
<span class="line"><span style="color:#24292e;">    @definition.ensure_equivalent_gemfile_and_lockfile if Bundler.frozen_bundle?</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;">    # Has to happen first</span></span>
<span class="line"><span style="color:#24292e;">    clean_load_path</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;">    # 根据definition获取所有Gem的spec信息</span></span>
<span class="line"><span style="color:#24292e;">    specs = @definition.specs_for(groups)</span></span>
<span class="line"><span style="color:#24292e;">  	# 设置bundle的环境变量等</span></span>
<span class="line"><span style="color:#24292e;">    SharedHelpers.set_bundle_environment</span></span>
<span class="line"><span style="color:#24292e;">    # 替换RubyGems的一些方法，比如activate_bin_path和find_spec_for_exe等</span></span>
<span class="line"><span style="color:#24292e;">    # 使Gem包从specs中获取（获取Gemfile中指定版本的Gem）</span></span>
<span class="line"><span style="color:#24292e;">    Bundler.rubygems.replace_entrypoints(specs)</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;">    # 将Gem包lib目录添加到$Load_PATH</span></span>
<span class="line"><span style="color:#24292e;">    # Activate the specs</span></span>
<span class="line"><span style="color:#24292e;">    load_paths = specs.map do |spec|</span></span>
<span class="line"><span style="color:#24292e;">      check_for_activated_spec!(spec)</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;">      Bundler.rubygems.mark_loaded(spec)</span></span>
<span class="line"><span style="color:#24292e;">      spec.load_paths.reject {|path| $LOAD_PATH.include?(path) }</span></span>
<span class="line"><span style="color:#24292e;">    end.reverse.flatten</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;">    Bundler.rubygems.add_to_load_path(load_paths)</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;">    setup_manpath</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;">    lock(:preserve_unknown_sections =&gt; true)</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;">    self</span></span>
<span class="line"><span style="color:#24292e;">  end</span></span></code></pre></div><p>终端上在工程目录下执行 <code>bundle info cocoapods</code>找到Gemfile中指定版本的cocoapods的安装路径, 再通过cat查看其bin目录下的pod文件内容，其核心逻辑如下：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#e1e4e8;">#!/usr/bin/env ruby</span></span>
<span class="line"><span style="color:#e1e4e8;"># ... 忽略一些对于编码处理的代码</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;">require &#39;cocoapods&#39;</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;"># 如果环境配置中指定了 ruby-prof 配置文件，会对执行命令过程进行性能监控</span></span>
<span class="line"><span style="color:#e1e4e8;">if profile_filename = ENV[&#39;COCOAPODS_PROFILE&#39;]</span></span>
<span class="line"><span style="color:#e1e4e8;">  require &#39;ruby-prof&#39;</span></span>
<span class="line"><span style="color:#e1e4e8;">  # 依据配置文件类型加载不同的 reporter 解析器</span></span>
<span class="line"><span style="color:#e1e4e8;">  # ...</span></span>
<span class="line"><span style="color:#e1e4e8;">  File.open(profile_filename, &#39;w&#39;) do |io|</span></span>
<span class="line"><span style="color:#e1e4e8;">    reporter.new(RubyProf.profile { Pod::Command.run(ARGV) }).print(io)</span></span>
<span class="line"><span style="color:#e1e4e8;">  end</span></span>
<span class="line"><span style="color:#e1e4e8;">else</span></span>
<span class="line"><span style="color:#e1e4e8;">  Pod::Command.run(ARGV)</span></span>
<span class="line"><span style="color:#e1e4e8;">end</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#24292e;">#!/usr/bin/env ruby</span></span>
<span class="line"><span style="color:#24292e;"># ... 忽略一些对于编码处理的代码</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;">require &#39;cocoapods&#39;</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;"># 如果环境配置中指定了 ruby-prof 配置文件，会对执行命令过程进行性能监控</span></span>
<span class="line"><span style="color:#24292e;">if profile_filename = ENV[&#39;COCOAPODS_PROFILE&#39;]</span></span>
<span class="line"><span style="color:#24292e;">  require &#39;ruby-prof&#39;</span></span>
<span class="line"><span style="color:#24292e;">  # 依据配置文件类型加载不同的 reporter 解析器</span></span>
<span class="line"><span style="color:#24292e;">  # ...</span></span>
<span class="line"><span style="color:#24292e;">  File.open(profile_filename, &#39;w&#39;) do |io|</span></span>
<span class="line"><span style="color:#24292e;">    reporter.new(RubyProf.profile { Pod::Command.run(ARGV) }).print(io)</span></span>
<span class="line"><span style="color:#24292e;">  end</span></span>
<span class="line"><span style="color:#24292e;">else</span></span>
<span class="line"><span style="color:#24292e;">  Pod::Command.run(ARGV)</span></span>
<span class="line"><span style="color:#24292e;">end</span></span></code></pre></div><p>Cocoapods依赖claide解析命令，Pod::Command继承自CLAide::Command，CLAide::Command的run方法：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#e1e4e8;">def self.run(argv = [])</span></span>
<span class="line"><span style="color:#e1e4e8;">  # 加载插件</span></span>
<span class="line"><span style="color:#e1e4e8;">  plugin_prefixes.each do |plugin_prefix|</span></span>
<span class="line"><span style="color:#e1e4e8;">    PluginManager.load_plugins(plugin_prefix)</span></span>
<span class="line"><span style="color:#e1e4e8;">  end</span></span>
<span class="line"><span style="color:#e1e4e8;"></span></span>
<span class="line"><span style="color:#e1e4e8;">  argv = ARGV.coerce(argv)</span></span>
<span class="line"><span style="color:#e1e4e8;">  # 解析出子命令</span></span>
<span class="line"><span style="color:#e1e4e8;">  command = parse(argv)</span></span>
<span class="line"><span style="color:#e1e4e8;">  ANSI.disabled = !command.ansi_output?</span></span>
<span class="line"><span style="color:#e1e4e8;">  unless command.handle_root_options(argv)</span></span>
<span class="line"><span style="color:#e1e4e8;">    command.validate!</span></span>
<span class="line"><span style="color:#e1e4e8;">    #命令的子类执行，例如Pod::Command::Install</span></span>
<span class="line"><span style="color:#e1e4e8;">    command.run</span></span>
<span class="line"><span style="color:#e1e4e8;">  end</span></span>
<span class="line"><span style="color:#e1e4e8;">rescue Object =&gt; exception</span></span>
<span class="line"><span style="color:#e1e4e8;">  handle_exception(command, exception)</span></span>
<span class="line"><span style="color:#e1e4e8;">end</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#24292e;">def self.run(argv = [])</span></span>
<span class="line"><span style="color:#24292e;">  # 加载插件</span></span>
<span class="line"><span style="color:#24292e;">  plugin_prefixes.each do |plugin_prefix|</span></span>
<span class="line"><span style="color:#24292e;">    PluginManager.load_plugins(plugin_prefix)</span></span>
<span class="line"><span style="color:#24292e;">  end</span></span>
<span class="line"><span style="color:#24292e;"></span></span>
<span class="line"><span style="color:#24292e;">  argv = ARGV.coerce(argv)</span></span>
<span class="line"><span style="color:#24292e;">  # 解析出子命令</span></span>
<span class="line"><span style="color:#24292e;">  command = parse(argv)</span></span>
<span class="line"><span style="color:#24292e;">  ANSI.disabled = !command.ansi_output?</span></span>
<span class="line"><span style="color:#24292e;">  unless command.handle_root_options(argv)</span></span>
<span class="line"><span style="color:#24292e;">    command.validate!</span></span>
<span class="line"><span style="color:#24292e;">    #命令的子类执行，例如Pod::Command::Install</span></span>
<span class="line"><span style="color:#24292e;">    command.run</span></span>
<span class="line"><span style="color:#24292e;">  end</span></span>
<span class="line"><span style="color:#24292e;">rescue Object =&gt; exception</span></span>
<span class="line"><span style="color:#24292e;">  handle_exception(command, exception)</span></span>
<span class="line"><span style="color:#24292e;">end</span></span></code></pre></div><p><strong>插件加载：</strong></p><p>Pod::Command重写了CLAide::Command的<code>plugin_prefixes</code>，值为<code>%w(claide cocoapods)</code>。PluginManager会去加载当前环境下所有包含 claide_plugin.rb 或 cocoapods_plugin.rb 文件的 Gem，例如cocoapods-nc插件lib目录下的<code>cocoapods_plugin.rb</code>。</p><p>关于cocoapods的其他详细解析，可以参考<a href="https://zhuanlan.zhihu.com/p/187272448" target="_blank" rel="noreferrer">Cocoapods历险记</a>系列文章。</p><h1 id="vscode断点调试ruby" tabindex="-1">VSCode断点调试Ruby <a class="header-anchor" href="#vscode断点调试ruby" aria-label="Permalink to &quot;VSCode断点调试Ruby&quot;">​</a></h1><p><strong>VSCode安装扩展：rdbg</strong></p><p><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5f0955e0a7084dc4af599ce5ab936a61~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1264&amp;h=210&amp;s=91535&amp;e=png&amp;b=191919" alt=""></p><p><strong>工程目录中创建Gemfile，添加以下Gem包，然后终端执行bundle install.</strong></p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#e1e4e8;">gem &#39;ruby-debug-ide&#39;</span></span>
<span class="line"><span style="color:#e1e4e8;">gem &#39;debase&#39;, &#39;0.2.5.beta2&#39;</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#24292e;">gem &#39;ruby-debug-ide&#39;</span></span>
<span class="line"><span style="color:#24292e;">gem &#39;debase&#39;, &#39;0.2.5.beta2&#39;</span></span></code></pre></div><p>0.2.5.beta2是debase的最高版本，0.2.5.beta1和0.2.4.1都会报错，issue: <a href="https://github.com/ruby-debug/debase/issues/91" target="_blank" rel="noreferrer">0.2.4.1 and 0.2.5.beta Fail to build on macOS Catalina 10.15.7</a></p><p><strong>用VSCode打开要调试的ruby项目，例如Cocoapods.</strong></p><p>如果调试当前使用版本的Cocopods，找的Cocopods所在目录，VSCode打开即可。</p><p>如果调试从github克隆的Cocopods，Gemfile里需要用path执行该Cocopods， 例如</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#e1e4e8;">gem &quot;cocoapods&quot;, :path =&gt; &#39;~/dev/CocoaPods/&#39;</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#24292e;">gem &quot;cocoapods&quot;, :path =&gt; &#39;~/dev/CocoaPods/&#39;</span></span></code></pre></div><p><strong>创建lanch.json</strong></p><p><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6bfd47195359414eb1dd99257fd21fb5~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1324&amp;h=970&amp;s=265568&amp;e=png&amp;b=191919" alt=""></p><p>launch.json内容：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#e1e4e8;">{</span></span>
<span class="line"><span style="color:#e1e4e8;">  // 使用 IntelliSense 了解相关属性。 </span></span>
<span class="line"><span style="color:#e1e4e8;">  // 悬停以查看现有属性的描述。</span></span>
<span class="line"><span style="color:#e1e4e8;">  // 欲了解更多信息，请访问: https://go.microsoft.com/fwlink/?linkid=830387</span></span>
<span class="line"><span style="color:#e1e4e8;">  &quot;version&quot;: &quot;0.2.0&quot;,</span></span>
<span class="line"><span style="color:#e1e4e8;">  &quot;configurations&quot;: [</span></span>
<span class="line"><span style="color:#e1e4e8;">    {</span></span>
<span class="line"><span style="color:#e1e4e8;">      &quot;type&quot;: &quot;rdbg&quot;,</span></span>
<span class="line"><span style="color:#e1e4e8;">      &quot;name&quot;: &quot;pod install&quot;, //配置名称，用于在调试器中标识该配置</span></span>
<span class="line"><span style="color:#e1e4e8;">      &quot;request&quot;: &quot;launch&quot;,</span></span>
<span class="line"><span style="color:#e1e4e8;">      &quot;script&quot;: &quot;/Users/yuanchao/.rvm/gems/ruby-3.0.0/bin/pod&quot;, //指定要执行的脚本或可执行文件的路径</span></span>
<span class="line"><span style="color:#e1e4e8;">      &quot;cwd&quot;: &quot;/Users/yuanchao/Project/NC&quot;, //指定在哪个目录下执行</span></span>
<span class="line"><span style="color:#e1e4e8;">      &quot;args&quot;: [&quot;install&quot;], //传递给脚本或可执行文件的命令行参数</span></span>
<span class="line"><span style="color:#e1e4e8;">      &quot;askParameters&quot;: true, //在启动调试会话之前提示用户输入其他参数</span></span>
<span class="line"><span style="color:#e1e4e8;">      &quot;useBundler&quot;: true, //使用Bundler</span></span>
<span class="line"><span style="color:#e1e4e8;">    }</span></span>
<span class="line"><span style="color:#e1e4e8;">  ]</span></span>
<span class="line"><span style="color:#e1e4e8;">}</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#24292e;">{</span></span>
<span class="line"><span style="color:#24292e;">  // 使用 IntelliSense 了解相关属性。 </span></span>
<span class="line"><span style="color:#24292e;">  // 悬停以查看现有属性的描述。</span></span>
<span class="line"><span style="color:#24292e;">  // 欲了解更多信息，请访问: https://go.microsoft.com/fwlink/?linkid=830387</span></span>
<span class="line"><span style="color:#24292e;">  &quot;version&quot;: &quot;0.2.0&quot;,</span></span>
<span class="line"><span style="color:#24292e;">  &quot;configurations&quot;: [</span></span>
<span class="line"><span style="color:#24292e;">    {</span></span>
<span class="line"><span style="color:#24292e;">      &quot;type&quot;: &quot;rdbg&quot;,</span></span>
<span class="line"><span style="color:#24292e;">      &quot;name&quot;: &quot;pod install&quot;, //配置名称，用于在调试器中标识该配置</span></span>
<span class="line"><span style="color:#24292e;">      &quot;request&quot;: &quot;launch&quot;,</span></span>
<span class="line"><span style="color:#24292e;">      &quot;script&quot;: &quot;/Users/yuanchao/.rvm/gems/ruby-3.0.0/bin/pod&quot;, //指定要执行的脚本或可执行文件的路径</span></span>
<span class="line"><span style="color:#24292e;">      &quot;cwd&quot;: &quot;/Users/yuanchao/Project/NC&quot;, //指定在哪个目录下执行</span></span>
<span class="line"><span style="color:#24292e;">      &quot;args&quot;: [&quot;install&quot;], //传递给脚本或可执行文件的命令行参数</span></span>
<span class="line"><span style="color:#24292e;">      &quot;askParameters&quot;: true, //在启动调试会话之前提示用户输入其他参数</span></span>
<span class="line"><span style="color:#24292e;">      &quot;useBundler&quot;: true, //使用Bundler</span></span>
<span class="line"><span style="color:#24292e;">    }</span></span>
<span class="line"><span style="color:#24292e;">  ]</span></span>
<span class="line"><span style="color:#24292e;">}</span></span></code></pre></div><p><strong>运行</strong></p><p><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f4288948716e47b5b805d5b48fe85397~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1220&amp;h=944&amp;s=189320&amp;e=png&amp;b=191919" alt=""></p><p><strong>断点调试RubyGems -&gt; Bundler -&gt; Cocoapods的流程</strong></p><p>1、在包含Gemfile的iOS项目目录下，执行<code>which bundle</code>，获取到bundle的可执行文件路径：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#e1e4e8;">$ which bundle</span></span>
<span class="line"><span style="color:#e1e4e8;">/Users/yuanchao/.rvm/gems/ruby-3.0.0/bin/bundle</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#24292e;">$ which bundle</span></span>
<span class="line"><span style="color:#24292e;">/Users/yuanchao/.rvm/gems/ruby-3.0.0/bin/bundle</span></span></code></pre></div><p>2、执行<code>which ruby</code>找到ruby目录，从而找到ruby的lib目录, 获得rubygems源码位置</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#e1e4e8;">$ which ruby</span></span>
<span class="line"><span style="color:#e1e4e8;">/Users/yuanchao/.rvm/rubies/ruby-3.0.0/bin/ruby</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#24292e;">$ which ruby</span></span>
<span class="line"><span style="color:#24292e;">/Users/yuanchao/.rvm/rubies/ruby-3.0.0/bin/ruby</span></span></code></pre></div><p>源码位置：/Users/yuanchao/.rvm/gems/ruby-3.0.0/lib/ruby/3.0.0</p><p><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d1b7af590c494d458bb4d5cb9e2b5034~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1216&amp;h=330&amp;s=89991&amp;e=png&amp;b=fbfbfb" alt=""></p><p>用VSCode打开/Users/yuanchao/.rvm/gems/ruby-3.0.0/bin/ruby/3.0.0，找到rubygems.rb文件，在<code>load Gem.activate_bin_path</code>这一行加上断点，在launch.json中添加如下配置：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#e1e4e8;">{</span></span>
<span class="line"><span style="color:#e1e4e8;">  &quot;version&quot;: &quot;0.2.0&quot;,</span></span>
<span class="line"><span style="color:#e1e4e8;">  &quot;configurations&quot;: [</span></span>
<span class="line"><span style="color:#e1e4e8;">    {</span></span>
<span class="line"><span style="color:#e1e4e8;">      &quot;type&quot;: &quot;rdbg&quot;,</span></span>
<span class="line"><span style="color:#e1e4e8;">      &quot;name&quot;: &quot;exec pod local list&quot;,</span></span>
<span class="line"><span style="color:#e1e4e8;">      &quot;request&quot;: &quot;launch&quot;,</span></span>
<span class="line"><span style="color:#e1e4e8;">      &quot;script&quot;: &quot;/Users/yuanchao/.rvm/gems/ruby-3.0.0/bin/bundle&quot;,</span></span>
<span class="line"><span style="color:#e1e4e8;">      &quot;args&quot;: [&quot;exec pod local list&quot;],</span></span>
<span class="line"><span style="color:#e1e4e8;">      &quot;askParameters&quot;: true,</span></span>
<span class="line"><span style="color:#e1e4e8;">      &quot;cwd&quot;: &quot;/Users/yuanchao/Project/NC&quot;,</span></span>
<span class="line"><span style="color:#e1e4e8;">    }</span></span>
<span class="line"><span style="color:#e1e4e8;">  ]</span></span>
<span class="line"><span style="color:#e1e4e8;">}</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#24292e;">{</span></span>
<span class="line"><span style="color:#24292e;">  &quot;version&quot;: &quot;0.2.0&quot;,</span></span>
<span class="line"><span style="color:#24292e;">  &quot;configurations&quot;: [</span></span>
<span class="line"><span style="color:#24292e;">    {</span></span>
<span class="line"><span style="color:#24292e;">      &quot;type&quot;: &quot;rdbg&quot;,</span></span>
<span class="line"><span style="color:#24292e;">      &quot;name&quot;: &quot;exec pod local list&quot;,</span></span>
<span class="line"><span style="color:#24292e;">      &quot;request&quot;: &quot;launch&quot;,</span></span>
<span class="line"><span style="color:#24292e;">      &quot;script&quot;: &quot;/Users/yuanchao/.rvm/gems/ruby-3.0.0/bin/bundle&quot;,</span></span>
<span class="line"><span style="color:#24292e;">      &quot;args&quot;: [&quot;exec pod local list&quot;],</span></span>
<span class="line"><span style="color:#24292e;">      &quot;askParameters&quot;: true,</span></span>
<span class="line"><span style="color:#24292e;">      &quot;cwd&quot;: &quot;/Users/yuanchao/Project/NC&quot;,</span></span>
<span class="line"><span style="color:#24292e;">    }</span></span>
<span class="line"><span style="color:#24292e;">  ]</span></span>
<span class="line"><span style="color:#24292e;">}</span></span></code></pre></div><p>运行断点如果跳不到bundler或者cocoapods项目中，可以将bundler或者cocoapods项目里的文件拖到VSCode工程中。</p>`,95),o=[l];function c(t,r,i,y,d,E){return n(),a("div",null,o)}const m=s(p,[["render",c]]);export{b as __pageData,m as default};

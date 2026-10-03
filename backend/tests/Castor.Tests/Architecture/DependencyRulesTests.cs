using System.Reflection;
using NetArchTest.Rules;

namespace Castor.Tests;

/// <summary>
/// The boundaries from docs/architecture/01-structure-conventions.md, checked on the compiled assembly. The check
/// reads IL, so a dependency hidden in a method body counts the same as a using directive.
/// </summary>
public sealed class DependencyRulesTests
{
    private const string Root = "Castor.Api";
    private const string DomainNamespace = Root + ".Domain";
    private const string PersistenceNamespace = Root + ".Persistence";
    private const string QueriesNamespace = Root + ".Queries";
    private const string InfrastructureNamespace = Root + ".Infrastructure";
    private const string FeaturesNamespace = Root + ".Features";

    private static readonly Assembly Api = typeof(CastorDbContext).Assembly;

    [Fact]
    public void Domain_knows_neither_EF_Core_nor_HTTP_nor_the_rest_of_the_application()
    {
        TestResult result = Types.InAssembly(Api)
            .That().ResideInNamespace(DomainNamespace)
            .ShouldNot().HaveDependencyOnAny(
                "Microsoft.EntityFrameworkCore",
                "Microsoft.AspNetCore",
                PersistenceNamespace,
                QueriesNamespace,
                InfrastructureNamespace,
                FeaturesNamespace)
            .GetResult();

        AssertPasses(result);
    }

    [Fact]
    public void Persistence_knows_neither_queries_nor_infrastructure_nor_features()
    {
        TestResult result = Types.InAssembly(Api)
            .That().ResideInNamespace(PersistenceNamespace)
            .ShouldNot().HaveDependencyOnAny(QueriesNamespace, InfrastructureNamespace, FeaturesNamespace)
            .GetResult();

        AssertPasses(result);
    }

    [Fact]
    public void Persistence_holds_no_query()
    {
        TestResult result = Types.InAssembly(Api)
            .That().ResideInNamespace(PersistenceNamespace)
            .ShouldNot().HaveNameEndingWith("Query")
            .GetResult();

        AssertPasses(result);
    }

    [Fact]
    public void Queries_know_neither_infrastructure_nor_features()
    {
        TestResult result = Types.InAssembly(Api)
            .That().ResideInNamespace(QueriesNamespace)
            .ShouldNot().HaveDependencyOnAny(InfrastructureNamespace, FeaturesNamespace)
            .GetResult();

        AssertPasses(result);
    }

    [Fact]
    public void A_class_reading_the_database_in_queries_is_an_injected_query()
    {
        TestResult result = Types.InAssembly(Api)
            .That().ResideInNamespace(QueriesNamespace)
            .And().AreNotNested()
            .And().HaveDependencyOn(PersistenceNamespace + ".CastorDbContext")
            .Should().HaveNameEndingWith("Query")
            .And().NotBeStatic()
            .GetResult();

        AssertPasses(result);
    }

    [Fact]
    public void Infrastructure_knows_neither_queries_nor_features()
    {
        TestResult result = Types.InAssembly(Api)
            .That().ResideInNamespace(InfrastructureNamespace)
            .ShouldNot().HaveDependencyOnAny(QueriesNamespace, FeaturesNamespace)
            .GetResult();

        AssertPasses(result);
    }

    [Fact]
    public void Feature_folders_do_not_share_code()
    {
        string[] featureFolders = FeatureNamespaces()
            .Select(FeatureFolderOf)
            .Distinct()
            .ToArray();

        List<string> crossings = [];
        foreach (string folder in featureFolders)
        {
            foreach (string otherFolder in featureFolders.Where(other => other != folder))
            {
                TestResult result = Types.InAssembly(Api)
                    .That().ResideInNamespace(folder)
                    .ShouldNot().HaveDependencyOn(otherFolder)
                    .GetResult();

                if (!result.IsSuccessful)
                {
                    crossings.Add($"{folder} -> {otherFolder}");
                }
            }
        }

        Assert.Empty(crossings);
    }

    [Fact]
    public void A_subfolder_of_a_feature_does_not_reach_into_its_siblings()
    {
        string[] subfolders = FeatureNamespaces()
            .Select(SubfolderOf)
            .OfType<string>()
            .Where(subfolder => !subfolder.EndsWith(".Converters", StringComparison.Ordinal))
            .Distinct()
            .ToArray();

        List<string> crossings = [];
        foreach (string subfolder in subfolders)
        {
            string featureFolder = FeatureFolderOf(subfolder);
            foreach (string sibling in subfolders.Where(other => other != subfolder && FeatureFolderOf(other) == featureFolder))
            {
                TestResult result = Types.InAssembly(Api)
                    .That().ResideInNamespace(subfolder)
                    .ShouldNot().HaveDependencyOn(sibling)
                    .GetResult();

                if (!result.IsSuccessful)
                {
                    crossings.Add($"{subfolder} -> {sibling}");
                }
            }
        }

        Assert.Empty(crossings);
    }

    private static IEnumerable<string> FeatureNamespaces()
    {
        return Api.GetTypes()
            .Select(type => type.Namespace)
            .OfType<string>()
            .Where(name => name.StartsWith(FeaturesNamespace + ".", StringComparison.Ordinal))
            .Distinct();
    }

    /// <summary>The feature folder is the first level under <c>Features</c>; its subfolders belong to it.</summary>
    private static string FeatureFolderOf(string featureNamespace)
    {
        int nameStart = FeaturesNamespace.Length + 1;
        int nameEnd = featureNamespace.IndexOf('.', nameStart);

        return nameEnd < 0 ? featureNamespace : featureNamespace[..nameEnd];
    }

    /// <summary>The second level under <c>Features</c>; null for a namespace of the feature folder itself.</summary>
    private static string? SubfolderOf(string featureNamespace)
    {
        string featureFolder = FeatureFolderOf(featureNamespace);
        if (featureNamespace == featureFolder)
        {
            return null;
        }

        string subfolderName = featureNamespace[(featureFolder.Length + 1)..].Split('.')[0];

        return featureFolder + "." + subfolderName;
    }

    private static void AssertPasses(TestResult result)
    {
        string[] offenders = (result.FailingTypes ?? []).Select(type => type.FullName ?? type.Name).ToArray();

        Assert.Empty(offenders);
    }
}
